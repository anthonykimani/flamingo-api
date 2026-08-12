import { Server, Socket } from 'socket.io';
import { GameRepository } from '../../repositories/game.repo';
import { PlayerRepository } from '../../repositories/player.repo';
import { PlayerAnswerRepository } from '../../repositories/player-answer.repo';
import { SocketEvents } from '../../enums/SocketEvents';
import { GameState } from '../../enums/GameState';
import { Player } from '../../models/player.entity';
import { flamingoEscrowService } from '../contracts/flamingo.escrow';
import { GameMode } from '../../enums/GameMode';
import { allowedOrigins } from '../../configs/corsconfig';
import { verifyToken, isGuestPayload, TokenPayload, WalletTokenPayload } from '../tokens';
import { submitAnswerForPlayer } from '../gameplay';

function emitError(socket: Socket, message: string) {
    socket.emit(SocketEvents.ERROR, { message });
}

/** Wallet payload of the socket, or null for guests/unauthenticated */
function walletUser(socket: Socket): WalletTokenPayload | null {
    const auth = socket.data.user as TokenPayload | undefined;
    if (!auth || isGuestPayload(auth)) return null;
    return auth;
}

/** True when the socket's wallet owns this game session */
function isHostSocket(socket: Socket, game: { hostAddress?: string }): boolean {
    const user = walletUser(socket);
    return !!game.hostAddress && !!user?.address &&
        game.hostAddress.toLowerCase() === user.address.toLowerCase();
}

export class SocketService {
    private static instance: SocketService;
    private io: Server | null = null;
    private gameRepository: GameRepository;
    private playerRepository: PlayerRepository;
    private playerAnswerRepository: PlayerAnswerRepository;
    private gameTimers: Map<string, NodeJS.Timeout> = new Map();
    private countdownTimers: Map<string, NodeJS.Timeout> = new Map();
    private preGameTimers: Map<string, NodeJS.Timeout> = new Map();
    private autoAdvanceTimers: Map<string, NodeJS.Timeout> = new Map();
    private autoStartedGames: Set<string> = new Set();
    private hostSockets: Map<string, Set<string>> = new Map();
    private designatedHosts: Map<string, string> = new Map();
    private lobbyTimers: Map<string, NodeJS.Timeout> = new Map();

    private constructor() {
        this.gameRepository = new GameRepository();
        this.playerRepository = new PlayerRepository();
        this.playerAnswerRepository = new PlayerAnswerRepository();
    }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public initialize(server: any): Server {
        this.io = new Server(server, {
            cors: {
                origin: allowedOrigins,
                methods: ['GET', 'POST']
            }
        });

        // Strict handshake auth: every socket must present a valid token
        // (wallet JWT or guest token issued by POST /games/join).
        this.io.use((socket, next) => {
            const token = socket.handshake.auth?.token;
            const payload = token ? verifyToken(token) : null;

            if (!payload) {
                next(new Error('Authentication required'));
                return;
            }

            socket.data.user = payload;
            next();
        });

        this.setupSocketHandlers();
        return this.io;
    }

    private setupSocketHandlers() {
        if (!this.io) return;

        this.io.on(SocketEvents.CONNECTION, (socket: Socket) => {
            console.log(`✅ Client connected: ${socket.id}`);

            // Join game room
            socket.on(SocketEvents.JOIN_GAME, async (data: { gameSessionId: string; playerName: string }) => {
                await this.handleJoinGame(socket, data);
            });

            // Leave game room
            socket.on(SocketEvents.LEAVE_GAME, async (data: { gameSessionId: string; playerName: string }) => {
                await this.handleLeaveGame(socket, data);
            });

            // Start game
            socket.on(SocketEvents.START_GAME, async (data: { gameSessionId: string }) => {
                await this.handleStartGame(socket, data);
            });

            // Next question
            socket.on(SocketEvents.NEXT_QUESTION, async (data: { gameSessionId: string; questionIndex: number }) => {
                await this.handleNextQuestion(socket, data);
            });

            // Submit answer
            socket.on(SocketEvents.SUBMIT_ANSWER, async (data: {
                gameSessionId: string;
                playerName: string;
                questionId: string;
                answerId: string;
                timeToAnswer: number;
            }) => {
                await this.handleSubmitAnswer(socket, data);
            });

            socket.on(SocketEvents.END_GAME, async (data: { gameSessionId: string }) => {
                try {
                    const game = await this.gameRepository.getSessionById(data.gameSessionId);
                    if (!game) {
                        emitError(socket, 'Game session not found');
                        return;
                    }
                    if (!isHostSocket(socket, game)) {
                        emitError(socket, 'Only the game host can end the game');
                        return;
                    }
                    await this.endGame(data.gameSessionId);
                } catch (error) {
                    console.error('Error in END_GAME handler:', error);
                    emitError(socket, 'Failed to end game');
                }
            });

            // Disconnect
            socket.on(SocketEvents.DISCONNECT, async () => {
                console.log(`❌ Client disconnected: ${socket.id}`);
                await this.handleDisconnect(socket);
            });
        });
    }

    private broadcastGameState(gameSessionId: string, state: GameState) {
        this.io?.to(gameSessionId).emit('game-state-changed', {
            state,
            gameSessionId,
            timestamp: new Date()
        });
        console.log(`📡 Broadcasted state change: ${state} for game ${gameSessionId}`);
    }

    private async handleJoinGame(socket: Socket, data: { gameSessionId: string; playerName: string, walletAddress?: string }) {
        try {
            const auth = socket.data.user as TokenPayload;

            // Guest tokens are authoritative: the socket can only ever join
            // the session/player the token was issued for.
            let gameSessionId = data.gameSessionId;
            let playerName = data.playerName;
            if (isGuestPayload(auth)) {
                if (data.gameSessionId !== auth.gameSessionId) {
                    emitError(socket, 'Session expired. Rejoin to continue.');
                    return;
                }
                playerName = auth.playerName;
            }

            // Check if game exists
            const game = await this.gameRepository.getSessionById(gameSessionId);
            if (!game) {
                emitError(socket, 'Game session not found');
                return;
            }

            // Host / Spectator: room membership only, no player entity.
            // 'Host' additionally requires ownership of the session.
            if (playerName === 'Host' || playerName === 'Spectator') {
                if (playerName === 'Host' && !isHostSocket(socket, game)) {
                    emitError(socket, 'Only the game host can join as Host');
                    return;
                }

                socket.join(gameSessionId);
                console.log(`🎮 ${playerName} joined room: ${gameSessionId}`);

                if (playerName === 'Host') {
                    if (!this.hostSockets.has(gameSessionId)) {
                        this.hostSockets.set(gameSessionId, new Set());
                    }
                    this.hostSockets.get(gameSessionId)!.add(socket.id);
                }

                socket.emit(SocketEvents.JOINED_GAME, {
                    success: true,
                    message: `${playerName} joined successfully`,
                    isHost: playerName === 'Host'
                });
                return;
            }

            // Wallet address always comes from the verified token — never
            // from client input, so prize payouts can't be redirected.
            const walletAddress = walletUser(socket)?.address?.toLowerCase();

            //  Require wallet address only for blockchain (Degen PvP) games
            if (game.gameMode === GameMode.DEGEN_PVP && !walletAddress) {
                emitError(socket, 'Wallet authentication required to join Degen PvP game');
                return;
            }


            // Check if player already exists
            let player = await this.playerRepository.getPlayerByNameAndSession(gameSessionId, playerName);

            if (!player) {
                // Create new player
                player = new Player();
                player.playerName = playerName;
                player.walletAddress = walletAddress;
                player.gameSession = { id: gameSessionId } as any;
                player.totalScore = 0;
                player.correctAnswers = 0;
                player.wrongAnswers = 0;
                player.currentStreak = 0;
                player.bestStreak = 0;
                player.hasAnsweredCurrent = false;
                player.hasDeposited = false;

                await this.playerRepository.savePlayer(player);
                console.log(`👤 New player created: ${playerName} (${walletAddress})`);
            } else {
                // Bind the verified wallet to an existing identity — but never
                // let a different wallet take over a wallet-bound player.
                if (player.walletAddress) {
                    if (walletAddress && player.walletAddress.toLowerCase() !== walletAddress) {
                        emitError(socket, 'That player name is bound to a different wallet');
                        return;
                    }
                } else if (walletAddress) {
                    player.walletAddress = walletAddress;
                    await this.playerRepository.savePlayer(player);
                }
                console.log(`👤 Existing player rejoined: ${playerName}`);
            }

            // Join socket room
            socket.join(gameSessionId);

            // Get updated player list (excluding host) and current game state
            const [players, currentGame] = await Promise.all([
                this.playerRepository.getLeaderboard(gameSessionId),
                this.gameRepository.getSessionById(gameSessionId)
            ]);

            // Confirm join to the player with current game state
            socket.emit(SocketEvents.JOINED_GAME, {
                success: true,
                player: player,
                gameState: currentGame?.status || game.status
            });

            // Notify all clients in the room about the new player
            this.io?.to(gameSessionId).emit(SocketEvents.PLAYER_JOINED, {
                playerName,
                players: players,
                totalPlayers: players.length
            });

            console.log(`✅ Player ${playerName} joined game ${gameSessionId}`);

            if (game.status === GameState.CREATED) {
                if (game.gameMode === GameMode.HANGOUTS && !this.lobbyTimers.has(gameSessionId)) {
                    this.startLobbyCountdown(gameSessionId);
                } else if (game.gameMode === GameMode.TEAM_BUILDING && !this.designatedHosts.has(gameSessionId)) {
                    const allPlayers = await this.playerRepository.getSessionPlayers(gameSessionId);
                    if (allPlayers.length === 1) {
                        this.designatedHosts.set(gameSessionId, playerName);
                        const hostSock = this.hostSockets.get(gameSessionId);
                        if (!hostSock || hostSock.size === 0) {
                            this.io?.to(gameSessionId).emit('host-transferred', {
                                successorName: playerName,
                                gameSessionId
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in handleJoinGame:', error);
            emitError(socket, 'Failed to join game');
        }
    }

    private cancelLobbyTimer(gameSessionId: string) {
        if (this.lobbyTimers.has(gameSessionId)) {
            clearInterval(this.lobbyTimers.get(gameSessionId)!);
            this.lobbyTimers.delete(gameSessionId);
        }
    }

    private startLobbyCountdown(gameSessionId: string) {
        if (this.lobbyTimers.has(gameSessionId)) return;

        const duration = 10;
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const count = Math.max(0, duration - elapsed);

            if (count > 0) {
                this.io?.to(gameSessionId).emit('pre-game-countdown', { count, gameSessionId });
            } else {
                clearInterval(interval);
                this.lobbyTimers.delete(gameSessionId);
                this.autoStartGame(gameSessionId);
            }
        }, 250);

        this.lobbyTimers.set(gameSessionId, interval);
    }

    private async autoStartGame(gameSessionId: string) {
        if (this.autoStartedGames.has(gameSessionId)) return;
        this.autoStartedGames.add(gameSessionId);

        try {
            const game = await this.gameRepository.getSessionWithDetails(gameSessionId);
            if (!game) return;

            // For Degen PvP, need at least 3 players
            if (game.gameMode === GameMode.DEGEN_PVP) {
                const players = await this.playerRepository.getSessionPlayers(gameSessionId);
                if (players.length < 3) return;
            }

            // Update game state to WAITING
            await this.gameRepository.updateGameState(gameSessionId, GameState.WAITING);
            this.broadcastGameState(gameSessionId, GameState.WAITING);

            // Broadcast game started event to all clients
            this.io?.to(gameSessionId).emit(SocketEvents.GAME_STARTED, {
                gameSessionId,
                message: 'Game is starting!'
            });

            console.log(`🚀 Game ${gameSessionId} auto-started - entering pre-game countdown`);

            // Start 10-second pre-game countdown
            this.startPreGameCountdown(gameSessionId);
        } catch (error) {
            this.autoStartedGames.delete(gameSessionId);
            console.error('Error in autoStartGame:', error);
        }
    }

    private async handleLeaveGame(socket: Socket, data: { gameSessionId: string; playerName: string }) {
        try {
            const auth = socket.data.user as TokenPayload;
            const { gameSessionId } = data;

            // Guests can only leave as their bound identity; wallet players
            // can only remove a player row bound to their own wallet.
            let playerName = data.playerName;
            if (isGuestPayload(auth)) {
                if (gameSessionId !== auth.gameSessionId) return;
                playerName = auth.playerName;
            } else if (playerName !== 'Host' && playerName !== 'Spectator') {
                const target = await this.playerRepository.getPlayerByNameAndSession(gameSessionId, playerName);
                const caller = walletUser(socket)?.address?.toLowerCase();
                if (target?.walletAddress && target.walletAddress.toLowerCase() !== caller) {
                    const game = await this.gameRepository.getSessionById(gameSessionId);
                    if (!game || !isHostSocket(socket, game)) return;
                }
            }

            socket.leave(gameSessionId);

            // Don't remove host
            if (playerName !== 'Host' && playerName !== 'Spectator') {
                await this.playerRepository.removePlayer(gameSessionId, playerName);

                const players = await this.playerRepository.getLeaderboard(gameSessionId);

                this.io?.to(gameSessionId).emit(SocketEvents.PLAYER_LEFT, {
                    playerName,
                    players: players,
                    totalPlayers: players.length
                });

                console.log(`👋 Player ${playerName} left game ${gameSessionId}`);
            }
        } catch (error) {
            console.error('Error in handleLeaveGame:', error);
        }
    }

    private async handleDisconnect(socket: Socket) {
        try {
            const auth = socket.data.user as TokenPayload;
            if (!auth) return;

            for (const [gameSessionId, sockets] of this.hostSockets.entries()) {
                if (!sockets.has(socket.id)) continue;

                sockets.delete(socket.id);

                const game = await this.gameRepository.getSessionById(gameSessionId);
                if (!game || game.status !== GameState.CREATED || game.gameMode !== GameMode.TEAM_BUILDING) continue;

                const successorName = this.designatedHosts.get(gameSessionId);
                if (!successorName) continue;

                this.io?.to(gameSessionId).emit('host-transferred', {
                    successorName,
                    gameSessionId
                });

                console.log(`🔄 Host transferred to ${successorName} for game ${gameSessionId}`);
            }
        } catch (error) {
            console.error('Error in handleDisconnect:', error);
        }
    }

    private async canStartGame(socket: Socket, game: any): Promise<boolean> {
        if (game.gameMode === GameMode.HANGOUTS) {
            if (isHostSocket(socket, game)) return true;
            // No host connected → any player in the room may start the game.
            const hostConnected = (this.hostSockets.get(game.id)?.size ?? 0) > 0;
            return !hostConnected && socket.rooms.has(game.id);
        }
        if (game.gameMode === GameMode.TEAM_BUILDING) {
            if (isHostSocket(socket, game)) return true;
            const auth = socket.data.user as TokenPayload;
            if (isGuestPayload(auth) && this.designatedHosts.get(game.id) === auth.playerName) return true;
            if (!isGuestPayload(auth)) {
                const walletAddr = (auth as WalletTokenPayload).address?.toLowerCase();
                if (walletAddr) {
                    const players = await this.playerRepository.getSessionPlayers(game.id);
                    const match = players.find(p => p.walletAddress?.toLowerCase() === walletAddr);
                    if (match && this.designatedHosts.get(game.id) === match.playerName) return true;
                }
            }
            return false;
        }
        return isHostSocket(socket, game);
    }

    private async handleStartGame(socket: Socket, data: { gameSessionId: string }) {
        try {
            const { gameSessionId } = data;

            const game = await this.gameRepository.getSessionWithDetails(gameSessionId);
            if (!game) {
                emitError(socket, 'Game not found');
                return;
            }

            // If an auto-start already kicked off (Hangouts), an authorised
            // start request (e.g. the host clicking "Start Now") cancels the
            // pending auto-start and wins, rather than being silently ignored.
            if (this.autoStartedGames.has(gameSessionId) || this.preGameTimers.has(gameSessionId)) {
                this.autoStartedGames.delete(gameSessionId);
                const preTimer = this.preGameTimers.get(gameSessionId);
                if (preTimer) {
                    clearInterval(preTimer);
                    clearTimeout(preTimer);
                    this.preGameTimers.delete(gameSessionId);
                }
            }

            this.cancelLobbyTimer(gameSessionId);

            if (!(await this.canStartGame(socket, game))) {
                emitError(socket, 'Only the game host can start the game');
                return;
            }

            // Check if already locked
            const isLocked = await this.gameRepository.isGameLocked(gameSessionId);
            if (isLocked) {
                emitError(socket, 'Game already locked on blockchain');
                return;
            }

            const players = await this.playerRepository.getSessionPlayers(gameSessionId);

            if (players.length < 3 && game.gameMode == GameMode.DEGEN_PVP) {
                socket.emit(SocketEvents.ERROR, { message: "Need at least 3 Players" });
                return;
            }


            const playersWithWallets = players.filter(player => player.walletAddress);

            if (playersWithWallets.length !== players.length && game.gameMode == GameMode.DEGEN_PVP) {
                socket.emit(SocketEvents.ERROR, {
                    message: "All players must connect their wallets"
                });
                return;
            }

            if (game.gameMode == GameMode.DEGEN_PVP) {
                try {
                    console.log(`🔒 Locking Deposits for game ${gameSessionId}...`);

                    const result = await flamingoEscrowService.createGameSession(
                        gameSessionId,
                        players.map(player => ({ walletAddress: player.walletAddress! }))
                    );

                    //  Use the improved method
                    await this.gameRepository.markGameLocked(
                        gameSessionId,
                        result.txHash
                    );


                    console.log(`✅ Deposits locked: ${result.txHash}`);

                } catch (error) {
                    console.error('❌ Failed to lock deposits: ', error);
                    socket.emit(SocketEvents.ERROR, {
                        message: `Failed to lock deposits: ${error}`
                    })
                }
            }

            // Update game state to WAITING (pre-countdown)
            await this.gameRepository.updateGameState(gameSessionId, GameState.WAITING);
            this.broadcastGameState(gameSessionId, GameState.WAITING);

            // Broadcast game started event to all clients
            this.io?.to(gameSessionId).emit(SocketEvents.GAME_STARTED, {
                gameSessionId,
                message: 'Game is starting!'
            });

            console.log(`🚀 Game ${gameSessionId} started - entering pre-game countdown`);

            // Start 10-second pre-game countdown
            this.startPreGameCountdown(gameSessionId);

        } catch (error) {
            console.error('Error in handleStartGame:', error);
            socket.emit(SocketEvents.ERROR, { message: 'Failed to start game' });
        }
    }

    private startPreGameCountdown(gameSessionId: string) {
        // Clear any existing pre-game timer
        if (this.preGameTimers.has(gameSessionId)) {
            clearInterval(this.preGameTimers.get(gameSessionId)!);
        }

        const duration = 10;
        const startTime = Date.now();

        const preGameInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const count = Math.max(0, duration - elapsed);

            if (count > 0) {
                console.log(`⏳ Pre-game countdown ${gameSessionId}: ${count}`);
                this.io?.to(gameSessionId).emit('pre-game-countdown', {
                    count,
                    gameSessionId
                });
            } else {
                clearInterval(preGameInterval);

                // Proceed to in-game countdown — tracked so endGame can cancel it
                const followUp = setTimeout(() => {
                    this.preGameTimers.delete(gameSessionId);
                    this.startCountdown(gameSessionId);
                }, 1000);
                this.preGameTimers.set(gameSessionId, followUp);
            }
        }, 250);

        this.preGameTimers.set(gameSessionId, preGameInterval);
    }

    private async startCountdown(gameSessionId: string) {
        try {
            // Update state to COUNTDOWN
            await this.gameRepository.updateGameState(gameSessionId, GameState.COUNTDOWN);
            this.broadcastGameState(gameSessionId, GameState.COUNTDOWN);

            const duration = 5;
            const startTime = Date.now();

            // Clear any existing countdown timer
            if (this.countdownTimers.has(gameSessionId)) {
                clearInterval(this.countdownTimers.get(gameSessionId)!);
            }

            // Broadcast countdown
            const countdownInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const count = Math.max(0, duration - elapsed);

                if (count > 0) {
                    console.log(`⏰ Countdown ${gameSessionId}: ${count}`);
                    this.io?.to(gameSessionId).emit('countdown-tick', {
                        count: count,
                        gameSessionId
                    });
                } else {
                    clearInterval(countdownInterval);
                    this.countdownTimers.delete(gameSessionId);

                    // Start first question
                    this.startQuestion(gameSessionId, 0);
                }
            }, 250);

            this.countdownTimers.set(gameSessionId, countdownInterval);

        } catch (error) {
            console.error('Error in startCountdown:', error);
        }
    }

    private async startQuestion(gameSessionId: string, questionIndex: number) {
        try {
            const game = await this.gameRepository.getSessionWithDetails(gameSessionId);
            if (!game || !game.quiz?.questions) {
                console.error('Game or questions not found');
                return;
            }

            const question = game.quiz.questions[questionIndex];
            if (!question) {
                // No more questions - end game
                await this.endGame(gameSessionId);
                return;
            }

            // Reset all players' hasAnsweredCurrent flag
            await this.playerRepository.resetAnsweredStatus(gameSessionId);

            // Update game state
            await this.gameRepository.updateCurrentQuestion(gameSessionId, questionIndex);
            await this.gameRepository.updateGameState(gameSessionId, GameState.IN_PROGRESS);
            this.broadcastGameState(gameSessionId, GameState.IN_PROGRESS);

            const questionStartTime = new Date();

            // Broadcast question started
            this.io?.to(gameSessionId).emit(SocketEvents.QUESTION_STARTED, {
                question: {
                    id: question.id,
                    question: question.question,
                    answers: question.answers,
                    questionNumber: questionIndex + 1,
                    totalQuestions: game.quiz.questions.length
                },
                questionIndex,
                duration: game.questionDuration || 10,
                startTime: questionStartTime
            });

            console.log(`📝 Question ${questionIndex + 1} started for game ${gameSessionId}`);

            // Start timer
            this.startQuestionTimer(gameSessionId, game.questionDuration || 10);

        } catch (error) {
            console.error('Error in startQuestion:', error);
        }
    }

    private startQuestionTimer(gameSessionId: string, duration: number) {
        // Clear existing timer
        if (this.gameTimers.has(gameSessionId)) {
            clearInterval(this.gameTimers.get(gameSessionId)!);
        }

        const startTime = Date.now();

        const timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const timeLeft = Math.max(0, duration - elapsed);

            // Broadcast time update
            this.io?.to(gameSessionId).emit('time-update', {
                timeLeft,
                gameSessionId
            });

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                this.gameTimers.delete(gameSessionId);

                // Question timeout - show results
                this.showQuestionResults(gameSessionId).catch(err =>
                    console.error('Error in question timer callback:', err)
                );
            }
        }, 250);

        this.gameTimers.set(gameSessionId, timerInterval);
    }

    private async handleSubmitAnswer(socket: Socket, data: {
        gameSessionId: string;
        playerName: string;
        questionId: string;
        answerId: string;
        timeToAnswer: number;
    }) {
        try {
            const auth = socket.data.user as TokenPayload;

            // Guest tokens pin the identity; wallet users must have joined the room
            let gameSessionId = data.gameSessionId;
            let playerName = data.playerName;
            if (isGuestPayload(auth)) {
                if (data.gameSessionId !== auth.gameSessionId) {
                    emitError(socket, 'Guest token is not valid for this game');
                    return;
                }
                playerName = auth.playerName;
            } else if (!socket.rooms.has(gameSessionId)) {
                emitError(socket, 'Join the game before submitting answers');
                return;
            }

            const { questionId, answerId, timeToAnswer } = data;

            console.log(`📥 Answer submitted by ${playerName}:`, { questionId, answerId, timeToAnswer });

            const result = await submitAnswerForPlayer({
                gameSessionId,
                playerName,
                questionId,
                answerId,
                timeToAnswer: timeToAnswer || 0
            });

            if (!result.ok) {
                emitError(socket, result.message);
                return;
            }

            // Confirm to player
            socket.emit(SocketEvents.ANSWER_SUBMITTED, {
                success: true,
                isCorrect: result.isCorrect,
                pointsEarned: result.pointsEarned,
                currentStreak: result.answerStreak,
                totalScore: result.player.totalScore
            });

            // Get answer count
            const players = await this.playerRepository.getSessionPlayers(gameSessionId);
            const answeredCount = players.filter(p => p.hasAnsweredCurrent).length;

            // Notify host of answer count
            this.io?.to(gameSessionId).emit(SocketEvents.PLAYER_ANSWERED, {
                playerName,
                answeredCount,
                totalPlayers: players.length
            });

            console.log(`✅ Answer recorded for ${playerName}: ${result.isCorrect ? 'CORRECT' : 'WRONG'} (+${result.pointsEarned} points)`);

        } catch (error) {
            console.error('Error in handleSubmitAnswer:', error);
            emitError(socket, 'Failed to submit answer');
        }
    }

    private async showQuestionResults(gameSessionId: string) {
        try {
            // Update state
            await this.gameRepository.updateGameState(gameSessionId, GameState.RESULTS_READY);
            this.broadcastGameState(gameSessionId, GameState.RESULTS_READY);

            // Get leaderboard and game for total question count
            const [leaderboard, game] = await Promise.all([
                this.playerRepository.getLeaderboard(gameSessionId),
                this.gameRepository.getSessionWithDetails(gameSessionId)
            ]);

            const isLastQuestion = !game?.quiz?.questions || 
                (game.currentQuestionIndex >= game.quiz.questions.length - 1);

            // Broadcast results
            this.io?.to(gameSessionId).emit(SocketEvents.QUESTION_RESULTS, {
                leaderboard,
                gameSessionId
            });

            console.log(`📊 Results shown for game ${gameSessionId}`);

            // Auto-advance after 5 seconds
            const autoAdvanceTimer = setTimeout(async () => {
                this.autoAdvanceTimers.delete(gameSessionId);
                if (isLastQuestion) {
                    await this.endGame(gameSessionId);
                } else {
                    const nextIndex = (game?.currentQuestionIndex || 0) + 1;
                    this.startCountdownForNext(gameSessionId, nextIndex);
                }
            }, 5000);
            this.autoAdvanceTimers.set(gameSessionId, autoAdvanceTimer);

        } catch (error) {
            console.error('Error in showQuestionResults:', error);
        }
    }

    private async startCountdownForNext(gameSessionId: string, questionIndex: number) {
        try {
            await this.gameRepository.updateGameState(gameSessionId, GameState.COUNTDOWN);
            this.broadcastGameState(gameSessionId, GameState.COUNTDOWN);

            const duration = 5;
            const startTime = Date.now();

            // Register in countdownTimers so endGame can cancel it
            if (this.countdownTimers.has(gameSessionId)) {
                clearInterval(this.countdownTimers.get(gameSessionId)!);
            }

            const countdownInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const count = Math.max(0, duration - elapsed);

                if (count > 0) {
                    this.io?.to(gameSessionId).emit('countdown-tick', {
                        count: count,
                        gameSessionId
                    });
                } else {
                    clearInterval(countdownInterval);
                    this.countdownTimers.delete(gameSessionId);
                    this.startQuestion(gameSessionId, questionIndex).catch(err =>
                        console.error('Error in countdown callback:', err)
                    );
                }
            }, 250);

            this.countdownTimers.set(gameSessionId, countdownInterval);

        } catch (error) {
            console.error('Error in startCountdownForNext:', error);
        }
    }

    private async handleNextQuestion(socket: Socket, data: { gameSessionId: string; questionIndex: number }) {
        try {
            const { gameSessionId, questionIndex } = data;

            const game = await this.gameRepository.getSessionById(gameSessionId);
            if (!game) {
                emitError(socket, 'Game session not found');
                return;
            }
            if (!isHostSocket(socket, game)) {
                emitError(socket, 'Only the game host can advance the game');
                return;
            }

            console.log(`➡️ Moving to question ${questionIndex + 1}`);

            // Cancel any pending auto-advance
            if (this.autoAdvanceTimers.has(gameSessionId)) {
                clearTimeout(this.autoAdvanceTimers.get(gameSessionId)!);
                this.autoAdvanceTimers.delete(gameSessionId);
            }

            // Start countdown for next question
            await this.gameRepository.updateGameState(gameSessionId, GameState.COUNTDOWN);
            this.broadcastGameState(gameSessionId, GameState.COUNTDOWN);

            const duration = 5;
            const startTime = Date.now();

            // Clear any existing countdown timer so endGame can always cancel it
            if (this.countdownTimers.has(gameSessionId)) {
                clearInterval(this.countdownTimers.get(gameSessionId)!);
            }

            const countdownInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const count = Math.max(0, duration - elapsed);

                if (count > 0) {
                    this.io?.to(gameSessionId).emit('countdown-tick', {
                        count: count,
                        gameSessionId
                    });
                } else {
                    clearInterval(countdownInterval);
                    this.countdownTimers.delete(gameSessionId);
                    this.startQuestion(gameSessionId, questionIndex).catch(err =>
                        console.error('Error in handleNextQuestion callback:', err)
                    );
                }
            }, 250);

            this.countdownTimers.set(gameSessionId, countdownInterval);

        } catch (error) {
            console.error('Error in handleNextQuestion:', error);
        }
    }

    private async endGame(gameSessionId: string) {
        try {
            // Clear timers
            if (this.gameTimers.has(gameSessionId)) {
                clearInterval(this.gameTimers.get(gameSessionId)!);
                this.gameTimers.delete(gameSessionId);
            }
            if (this.countdownTimers.has(gameSessionId)) {
                clearInterval(this.countdownTimers.get(gameSessionId)!);
                this.countdownTimers.delete(gameSessionId);
            }
            if (this.preGameTimers.has(gameSessionId)) {
                clearInterval(this.preGameTimers.get(gameSessionId)!);
                this.preGameTimers.delete(gameSessionId);
            }
            if (this.autoAdvanceTimers.has(gameSessionId)) {
                clearTimeout(this.autoAdvanceTimers.get(gameSessionId)!);
                this.autoAdvanceTimers.delete(gameSessionId);
            }
            if (this.lobbyTimers.has(gameSessionId)) {
                clearInterval(this.lobbyTimers.get(gameSessionId)!);
                this.lobbyTimers.delete(gameSessionId);
            }

            // Update game state
            await this.gameRepository.updateGameState(gameSessionId, GameState.COMPLETED);
            this.broadcastGameState(gameSessionId, GameState.COMPLETED);
            await this.gameRepository.endSession(gameSessionId);

            // Get final leaderboard
            const leaderboard = await this.playerRepository.getLeaderboard(gameSessionId);

            const game = await this.gameRepository.getSessionWithDetails(gameSessionId);

            // Distribute prizes if we have 3+ players
            if (leaderboard.length >= 3 && game?.gameMode == GameMode.DEGEN_PVP) {
                try {
                    console.log(`🏆 Distributing prizes for game ${gameSessionId}...`);



                    const winners: [string, string, string] = [
                        leaderboard[0].walletAddress!,
                        leaderboard[1].walletAddress!,
                        leaderboard[2].walletAddress!
                    ];

                    // Validate winners have wallet addresses
                    if (!winners[0] || !winners[1] || !winners[2]) {
                        throw new Error('Winners missing wallet addresses');
                    }

                    const result = await flamingoEscrowService.distributePrizes(
                        gameSessionId,
                        winners
                    );

                    // Save blockchain info
                    await this.gameRepository.markPrizesDistributed(
                        gameSessionId,
                        result.txHash
                    );


                    console.log(`✅ Prizes distributed: ${result.txHash}`);

                    // Notify players about prize distribution
                    this.io?.to(gameSessionId).emit('prizes-distributed', {
                        txHash: result.txHash,
                        winners: winners
                    });
                } catch (error) {
                    // Continue to show results even if blockchain fails
                    this.io?.to(gameSessionId).emit('prize-distribution-failed', {
                        message: 'Failed to distribute prizes. Please contact support.'
                    });
                }
            }

            // Broadcast game ended
            this.io?.to(gameSessionId).emit(SocketEvents.GAME_ENDED, {
                leaderboard,
                gameSessionId,
                message: 'Game completed!'
            });

            console.log(`🏁 Game ${gameSessionId} ended`);

        } catch (error) {
            console.error('Error in endGame:', error);
        }
    }

    public getIO(): Server | null {
        return this.io;
    }
}