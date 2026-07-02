import { Server, Socket } from 'socket.io';
import { GameRepository } from '../../repositories/game.repo';
import { PlayerRepository } from '../../repositories/player.repo';
import { PlayerAnswerRepository } from '../../repositories/player-answer.repo';
import { SocketEvents } from '../../enums/SocketEvents';
import { GameState } from '../../enums/GameState';
import { Player } from '../../models/player.entity';
import { flamingoEscrowService } from '../contracts/flamingo.escrow';
import { GameMode } from '../../enums/GameMode';

export class SocketService {
    private static instance: SocketService;
    private io: Server | null = null;
    private gameRepository: GameRepository;
    private playerRepository: PlayerRepository;
    private playerAnswerRepository: PlayerAnswerRepository;
    private gameTimers: Map<string, NodeJS.Timeout> = new Map();
    private countdownTimers: Map<string, NodeJS.Timeout> = new Map();
    private preGameTimers: Map<string, NodeJS.Timeout> = new Map();

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
                origin: process.env.FRONTEND_URL || '*',
                methods: ['GET', 'POST']
            }
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
                await this.endGame(data.gameSessionId);
            });

            // Disconnect
            socket.on(SocketEvents.DISCONNECT, () => {
                console.log(`❌ Client disconnected: ${socket.id}`);
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
            const { gameSessionId, playerName, walletAddress } = data;

            // FIX #1: Don't add host as a player
            if (playerName === 'Host' || playerName === 'Spectator') {
                // Just join the room, don't create player entity
                socket.join(gameSessionId);
                console.log(`🎮 Host joined room: ${gameSessionId}`);

                socket.emit(SocketEvents.JOINED_GAME, {
                    success: true,
                    message: 'Host joined successfully',
                    isHost: true
                });
                return;
            }

            // Check if game exists
            const game = await this.gameRepository.getSessionById(gameSessionId);
            if (!game) {
                socket.emit(SocketEvents.ERROR, { message: 'Game session not found' });
                return;
            }

            //  Require wallet address only for blockchain (Degen PvP) games
            if (game.gameMode === GameMode.DEGEN_PVP && !walletAddress) {
                socket.emit(SocketEvents.ERROR, {
                    message: 'Wallet address required to join Degen PvP game'
                });
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
                if (player.walletAddress !== walletAddress) {
                    player.walletAddress = walletAddress;
                    await this.playerRepository.savePlayer(player);
                }
                console.log(`👤 Existing player rejoined: ${playerName}`);

                // Confirm rejoin to the player
                socket.emit(SocketEvents.JOINED_GAME, {
                    success: true,
                    player: player,
                    gameState: game.status
                });
            }

            // Join socket room
            socket.join(gameSessionId);

            // Auto-start if countdown not already running
            if (!this.preGameTimers.has(gameSessionId)) {
                console.log(`🎮 Auto-starting game ${gameSessionId} (player joined)`);
                await this.autoStartGame(gameSessionId);
            }

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
        } catch (error) {
            console.error('Error in handleJoinGame:', error);
            socket.emit(SocketEvents.ERROR, { message: 'Failed to join game' });
        }
    }

    private async autoStartGame(gameSessionId: string) {
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
            console.error('Error in autoStartGame:', error);
        }
    }

    private async handleLeaveGame(socket: Socket, data: { gameSessionId: string; playerName: string }) {
        try {
            const { gameSessionId, playerName } = data;

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

    private async handleStartGame(socket: Socket, data: { gameSessionId: string }) {
        try {
            const { gameSessionId } = data;

            // Check if already locked
            const isLocked = await this.gameRepository.isGameLocked(gameSessionId);
            if (isLocked) {
                socket.emit(SocketEvents.ERROR, { message: 'Game already locked on blockchain' });
                return;
            }

            const game = await this.gameRepository.getSessionWithDetails(gameSessionId);
            if (!game) {
                socket.emit(SocketEvents.ERROR, { message: 'Game not found' });
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
                this.preGameTimers.delete(gameSessionId);

                // Proceed to in-game countdown
                setTimeout(() => {
                    this.startCountdown(gameSessionId);
                }, 1000);
            }
        }, 250);

        this.preGameTimers.set(gameSessionId, preGameInterval);
    }

    private async startCountdown(gameSessionId: string) {
        try {
            // Update state to COUNTDOWN
            await this.gameRepository.updateGameState(gameSessionId, GameState.COUNTDOWN);
            this.broadcastGameState(gameSessionId, GameState.COUNTDOWN);

            const duration = 3;
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

        const timerInterval = setInterval(async () => {
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
                await this.showQuestionResults(gameSessionId);
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
            const { gameSessionId, playerName, questionId, answerId, timeToAnswer } = data;

            console.log(`📥 Answer submitted by ${playerName}:`, { questionId, answerId, timeToAnswer });

            // Get player
            const player = await this.playerRepository.getPlayerByNameAndSession(gameSessionId, playerName);
            if (!player) {
                socket.emit(SocketEvents.ERROR, { message: 'Player not found' });
                return;
            }

            // Check if already answered
            if (player.hasAnsweredCurrent) {
                socket.emit(SocketEvents.ERROR, { message: 'Already answered this question' });
                return;
            }

            // Get game and question
            const game = await this.gameRepository.getSessionWithDetails(gameSessionId);
            if (!game) {
                socket.emit(SocketEvents.ERROR, { message: 'Game not found' });
                return;
            }

            const question = game.quiz?.questions?.find(q => q.id === questionId);
            if (!question) {
                socket.emit(SocketEvents.ERROR, { message: 'Question not found' });
                return;
            }

            const selectedAnswer = question.answers?.find(a => a.id === answerId);
            if (!selectedAnswer) {
                socket.emit(SocketEvents.ERROR, { message: 'Answer not found' });
                return;
            }

            const isCorrect = selectedAnswer.correctAnswer;

            // Calculate score
            let pointsEarned = 0;
            let newStreak = player.currentStreak;

            if (isCorrect) {
                newStreak = player.currentStreak + 1;

                // Base points
                pointsEarned = 100;

                // Streak bonus
                pointsEarned += newStreak * 50;

                // Time bonus (max 50 points)
                const timeBonusPercent = Math.max(0, (game.questionDuration - timeToAnswer) / game.questionDuration);
                const timeBonus = Math.floor(timeBonusPercent * 50);
                pointsEarned += timeBonus;

                // Update player stats
                player.totalScore += pointsEarned;
                player.correctAnswers += 1;
                player.currentStreak = newStreak;
                player.bestStreak = Math.max(player.bestStreak, newStreak);
            } else {
                // Wrong answer - reset streak
                newStreak = 0;
                player.wrongAnswers += 1;
                player.currentStreak = 0;
            }

            player.hasAnsweredCurrent = true;
            await this.playerRepository.savePlayer(player);

            // Save answer record
            try {
                await this.playerAnswerRepository.saveAnswer({
                    gameSessionId,
                    playerName,
                    questionId,
                    answerId,
                    isCorrect,
                    pointsEarned,
                    answerStreak: newStreak,
                    timeToAnswer
                });
                console.log(`💾 Answer saved to database`);
            } catch (saveError) {
                console.error('Failed to save answer to database:', saveError);
                // Continue anyway - player stats are already updated
            }

            // Confirm to player
            socket.emit(SocketEvents.ANSWER_SUBMITTED, {
                success: true,
                isCorrect,
                pointsEarned,
                currentStreak: newStreak,
                totalScore: player.totalScore
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

            console.log(`✅ Answer recorded for ${playerName}: ${isCorrect ? 'CORRECT' : 'WRONG'} (+${pointsEarned} points)`);

        } catch (error) {
            console.error('Error in handleSubmitAnswer:', error);
            socket.emit(SocketEvents.ERROR, { message: 'Failed to submit answer' });
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
            setTimeout(async () => {
                if (isLastQuestion) {
                    await this.endGame(gameSessionId);
                } else {
                    const nextIndex = (game?.currentQuestionIndex || 0) + 1;
                    this.startCountdownForNext(gameSessionId, nextIndex);
                }
            }, 5000);

        } catch (error) {
            console.error('Error in showQuestionResults:', error);
        }
    }

    private async startCountdownForNext(gameSessionId: string, questionIndex: number) {
        try {
            await this.gameRepository.updateGameState(gameSessionId, GameState.COUNTDOWN);
            this.broadcastGameState(gameSessionId, GameState.COUNTDOWN);

            const duration = 3;
            const startTime = Date.now();

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
                    this.startQuestion(gameSessionId, questionIndex);
                }
            }, 250);

        } catch (error) {
            console.error('Error in startCountdownForNext:', error);
        }
    }

    private async handleNextQuestion(socket: Socket, data: { gameSessionId: string; questionIndex: number }) {
        try {
            const { gameSessionId, questionIndex } = data;

            console.log(`➡️ Moving to question ${questionIndex + 1}`);

            // Start countdown for next question
            await this.gameRepository.updateGameState(gameSessionId, GameState.COUNTDOWN);
            this.broadcastGameState(gameSessionId, GameState.COUNTDOWN);

            const duration = 3;
            const startTime = Date.now();

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
                    this.startQuestion(gameSessionId, questionIndex);
                }
            }, 250);

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