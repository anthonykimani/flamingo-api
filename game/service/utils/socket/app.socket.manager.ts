import { GameRepository } from "../../repositories/game.repo";
import { PlayerRepository } from "../../repositories/player.repo";
import { ServerOptions, Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { Exception } from "../exceptions/Exception";
import { SocketEvents } from "../../enums/SocketEvents";
import Validator from "../validators/validator";
import { Game } from "../../models/game.entity";
import { GameState } from "../../enums/GameState";

export class SocketService {
    private static instance: SocketService;
    private io: SocketServer | null = null;
    protected gameRepo: GameRepository = new GameRepository();
    protected playerRepo: PlayerRepository = new PlayerRepository();
    private timers: Map<string, NodeJS.Timeout> = new Map();

    private constructor() {}

    static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    initialize(httpServer: HttpServer, opts?: Partial<ServerOptions>) {
        try {
            if (!this.io) {
                this.io = new SocketServer(httpServer, {
                    cors: {
                        origin: process.env.CLIENT_URL || "http://localhost:3000",
                        methods: ["GET", "POST"],
                        credentials: true
                    },
                    ...opts
                });

                if (this.io) {
                    this.setupEventListeners();
                    console.log("✅ Socket.IO initialized successfully");
                }
            }

            return this.io;
        } catch (error) {
            new Exception("Socket.IO has not been initialized.", 500, "major", error, "initialize");
            throw error;
        }
    }

    getIO(): SocketServer {
        if (!this.io) {
            new Exception("Socket.IO has not been initialized", 500, "major", "Socket.IO has not been initialized", "getIO");
            throw new Error("Socket.IO has not been initialized. Please call initialize() first.");
        }

        return this.io;
    }

    private setupEventListeners() {
        if (!this.io) {
            new Exception(
                "Socket.IO has not been initialized.",
                500,
                "major",
                "Socket.IO has not been initialized.",
                "setupEventListeners"
            );
            return;
        }

        this.io.on(SocketEvents.CONNECTION, async (socket: Socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            // Handle joining a game
            socket.on(SocketEvents.JOIN_GAME, async (data: { gameSessionId: string, playerName: string }) => {
                await this.handleJoinGame(socket, data);
            });

            // Handle leaving a game
            socket.on(SocketEvents.LEAVE_GAME, async (data: { gameSessionId: string, playerName: string }) => {
                await this.handleLeaveGame(socket, data);
            });

            // Handle host starting the game
            socket.on(SocketEvents.START_GAME, async (data: { gameSessionId: string }) => {
                await this.handleStartGame(socket, data);
            });

            // Handle host moving to next question
            socket.on(SocketEvents.NEXT_QUESTION, async (data: { gameSessionId: string, questionIndex: number }) => {
                await this.handleNextQuestion(socket, data);
            });

            // Handle player submitting answer
            socket.on(SocketEvents.SUBMIT_ANSWER, async (data: any) => {
                await this.handleSubmitAnswer(socket, data);
            });

            // Handle host ending game
            socket.on(SocketEvents.END_GAME, async (data: { gameSessionId: string }) => {
                await this.handleEndGame(socket, data);
            });

            // Handle disconnect
            socket.on(SocketEvents.DISCONNECT, async () => {
                await this.handleDisconnect(socket);
            });
        });
    }

    /**
     * Handle player joining game
     */
    private async handleJoinGame(
        socket: Socket,
        data: { gameSessionId: string, playerName: string }
    ) {
        try {
            const { gameSessionId, playerName } = data;

            if (Validator.isEmpty(gameSessionId) || Validator.isEmpty(playerName)) {
                socket.emit(SocketEvents.ERROR, { message: "Session ID and player name are required" });
                return;
            }

            // Get current game state
            const game = await this.gameRepo.getSessionWithDetails(gameSessionId);
            
            if (!game) {
                socket.emit(SocketEvents.ERROR, { message: "Game not found" });
                return;
            }

            // Check if game is already full or completed
            if (game.status === GameState.COMPLETED) {
                socket.emit(SocketEvents.ERROR, { message: "Game has ended" });
                return;
            }

            // Find or create player
            let player = await this.playerRepo.getPlayerByNameAndSession(gameSessionId, playerName);
            
            if (!player) {
                // Check if nickname is available
                const existingPlayer = await this.playerRepo.getPlayerByNameAndSession(gameSessionId, playerName);
                if (existingPlayer) {
                    socket.emit(SocketEvents.ERROR, { message: "Nickname already taken" });
                    return;
                }

                // Create new player
                player = await this.playerRepo.savePlayer({
                    gameSession: { id: gameSessionId } as any,
                    playerName,
                    totalScore: 0,
                    correctAnswers: 0,
                    wrongAnswers: 0,
                    currentStreak: 0,
                    bestStreak: 0,
                    hasAnsweredCurrent: false,
                    joinedAt: new Date()
                } as any);

                console.log(`👤 New player ${playerName} joined game ${gameSessionId}`);
            } else {
                console.log(`🔄 Player ${playerName} rejoined game ${gameSessionId}`);
            }

            // Join socket room
            socket.join(gameSessionId);
            socket.data.gameSessionId = gameSessionId;
            socket.data.playerName = playerName;

            // Calculate current time left
            const timeLeft = this.calculateTimeLeft(game);

            // Send current game state to the joining player (for rejoining)
            socket.emit(SocketEvents.JOINED_GAME, {
                gameSessionId,
                playerName,
                gameState: game.status,
                currentQuestionIndex: game.currentQuestionIndex || 0,
                timeLeft,
                currentQuestion: game.quiz?.questions?.[game.currentQuestionIndex || 0] || null,
                totalQuestions: game.quiz?.questions?.length || 0,
                playerStats: {
                    totalScore: player.totalScore,
                    correctAnswers: player.correctAnswers,
                    wrongAnswers: player.wrongAnswers,
                    currentStreak: player.currentStreak,
                    bestStreak: player.bestStreak
                },
                hasAnsweredCurrent: player.hasAnsweredCurrent || false
            });

            // Notify all players about new player
            const playerCount = await this.getPlayerCount(gameSessionId);
            this.io?.to(gameSessionId).emit(SocketEvents.PLAYER_JOINED, {
                playerName,
                playerCount
            });

        } catch (error) {
            console.error("❌ Error in handleJoinGame:", error);
            socket.emit(SocketEvents.ERROR, { message: "Failed to join game" });
        }
    }

    /**
     * Handle player leaving game
     */
    private async handleLeaveGame(
        socket: Socket,
        data: { gameSessionId: string, playerName: string }
    ) {
        try {
            const { gameSessionId, playerName } = data;

            socket.leave(gameSessionId);
            
            const playerCount = await this.getPlayerCount(gameSessionId);
            this.io?.to(gameSessionId).emit(SocketEvents.PLAYER_LEFT, {
                playerName,
                playerCount
            });

            console.log(`👋 Player ${playerName} left game ${gameSessionId}`);
        } catch (error) {
            console.error("❌ Error in handleLeaveGame:", error);
        }
    }

    /**
     * Handle host starting the game
     */
    private async handleStartGame(
        socket: Socket,
        data: { gameSessionId: string }
    ) {
        try {
            const { gameSessionId } = data;

            const game = await this.gameRepo.getSessionWithDetails(gameSessionId);
            
            if (!game) {
                socket.emit(SocketEvents.ERROR, { message: "Game not found" });
                return;
            }

            // Update game state to COUNTDOWN
            await this.gameRepo.updateGameState(gameSessionId, GameState.COUNTDOWN);
            await this.gameRepo.updateCurrentQuestion(gameSessionId, 0);
            
            game.currentQuestionIndex = 0;
            await this.gameRepo.saveSession(game);

            // Reset all players' answered status
            await this.playerRepo.resetAnsweredStatus(gameSessionId);

            // Get first question
            const firstQuestion = game.quiz?.questions?.[0];

            // Notify all players - game is starting, navigate to game page
            this.io?.to(gameSessionId).emit(SocketEvents.GAME_STARTED, {
                gameSessionId,
                currentQuestionIndex: 0,
                question: firstQuestion,
                totalQuestions: game.quiz?.questions?.length || 0
            });

            console.log(`🎮 Game ${gameSessionId} started - broadcasting countdown`);

            // Start countdown sequence - backend controls timing
            this.broadcastCountdown(gameSessionId, 3, async () => {
                // Countdown finished, now start the timer
                await this.gameRepo.updateGameState(gameSessionId, GameState.IN_PROGRESS);
                
                game.questionStartedAt = new Date();
                game.timeLeft = game.questionDuration || 10;
                await this.gameRepo.saveSession(game);

                // Start the question timer
                this.startQuestionTimer(gameSessionId);

                // Notify everyone timer has started
                this.io?.to(gameSessionId).emit(SocketEvents.QUESTION_STARTED, {
                    gameSessionId,
                    questionIndex: 0,
                    timeLeft: game.timeLeft
                });

                console.log(`⏱️ Timer started for game ${gameSessionId}`);
            });

        } catch (error) {
            console.error("❌ Error in handleStartGame:", error);
            socket.emit(SocketEvents.ERROR, { message: "Failed to start game" });
        }
    }

    /**
     * Handle host moving to next question
     */
    private async handleNextQuestion(
        socket: Socket,
        data: { gameSessionId: string, questionIndex: number }
    ) {
        try {
            const { gameSessionId, questionIndex } = data;

            const game = await this.gameRepo.getSessionWithDetails(gameSessionId);
            
            if (!game) {
                socket.emit(SocketEvents.ERROR, { message: "Game not found" });
                return;
            }

            // Clear previous timer
            this.clearQuestionTimer(gameSessionId);

            // Update game state to COUNTDOWN
            await this.gameRepo.updateGameState(gameSessionId, GameState.COUNTDOWN);
            await this.gameRepo.updateCurrentQuestion(gameSessionId, questionIndex);
            
            game.currentQuestionIndex = questionIndex;
            await this.gameRepo.saveSession(game);

            // Reset all players' answered status
            await this.playerRepo.resetAnsweredStatus(gameSessionId);

            // Get the question
            const question = game.quiz?.questions?.[questionIndex];

            // Notify all players - show next question
            this.io?.to(gameSessionId).emit(SocketEvents.NEXT_QUESTION, {
                gameSessionId,
                questionIndex,
                question
            });

            console.log(`➡️ Game ${gameSessionId} moved to question ${questionIndex} - broadcasting countdown`);

            // Start countdown sequence
            this.broadcastCountdown(gameSessionId, 3, async () => {
                // Countdown finished, start the timer
                await this.gameRepo.updateGameState(gameSessionId, GameState.IN_PROGRESS);
                
                game.questionStartedAt = new Date();
                game.timeLeft = game.questionDuration || 10;
                await this.gameRepo.saveSession(game);

                // Start question timer
                this.startQuestionTimer(gameSessionId);

                // Notify everyone timer has started
                this.io?.to(gameSessionId).emit(SocketEvents.QUESTION_STARTED, {
                    gameSessionId,
                    questionIndex,
                    timeLeft: game.timeLeft
                });

                console.log(`⏱️ Timer started for question ${questionIndex}`);
            });

        } catch (error) {
            console.error("❌ Error in handleNextQuestion:", error);
            socket.emit(SocketEvents.ERROR, { message: "Failed to move to next question" });
        }
    }

    /**
     * Handle player submitting answer
     */
    private async handleSubmitAnswer(
        socket: Socket,
        data: {
            gameSessionId: string;
            playerName: string;
            questionId: string;
            answerId: string;
            timeToAnswer: number;
        }
    ) {
        try {
            const { gameSessionId, playerName, questionId, answerId, timeToAnswer } = data;

            const game = await this.gameRepo.getSessionWithDetails(gameSessionId);
            
            if (!game) {
                socket.emit(SocketEvents.ERROR, { message: "Game not found" });
                return;
            }

            // Check if game is still accepting answers
            if (game.status !== GameState.IN_PROGRESS) {
                socket.emit(SocketEvents.ERROR, { message: "Question is closed" });
                return;
            }

            // Get player
            const player = await this.playerRepo.getPlayerByNameAndSession(gameSessionId, playerName);
            
            if (!player) {
                socket.emit(SocketEvents.ERROR, { message: "Player not found" });
                return;
            }

            if (player.hasAnsweredCurrent) {
                socket.emit(SocketEvents.ERROR, { message: "Already answered this question" });
                return;
            }

            // Find the answer and check correctness
            const question = game.quiz.questions[game.currentQuestionIndex];
            const answer = question.answers.find(a => a.id === answerId);
            const isCorrect = answer?.correctAnswer || false;

            // Calculate points (time-based scoring)
            let points = 0;
            let newStreak = player.currentStreak;
            
            if (isCorrect) {
                newStreak = player.currentStreak + 1;
                const timeBonus = Math.floor(((game.questionDuration - timeToAnswer) / game.questionDuration) * 50);
                points = 100 + (newStreak * 50) + timeBonus;
            } else {
                newStreak = 0;
            }

            // Update player stats
            await this.playerRepo.updatePlayerStats({
                gameSessionId,
                playerName,
                totalScore: player.totalScore + points,
                correctAnswers: isCorrect ? player.correctAnswers + 1 : player.correctAnswers,
                wrongAnswers: !isCorrect ? player.wrongAnswers + 1 : player.wrongAnswers,
                currentStreak: newStreak,
                bestStreak: Math.max(player.bestStreak, newStreak)
            });

            // Mark as answered
            player.hasAnsweredCurrent = true;
            await this.playerRepo.savePlayer(player);

            // Send confirmation to player
            socket.emit(SocketEvents.ANSWER_SUBMITTED, {
                isCorrect,
                pointsEarned: points,
                newScore: player.totalScore + points,
                currentStreak: newStreak
            });

            // Notify host about answer received
            const answerCount = await this.getAnswerCount(gameSessionId);
            this.io?.to(gameSessionId).emit(SocketEvents.PLAYER_ANSWERED, {
                playerName,
                answerCount
            });

            console.log(`✅ Player ${playerName} answered (${isCorrect ? 'correct' : 'wrong'})`);
        } catch (error) {
            console.error("❌ Error in handleSubmitAnswer:", error);
            socket.emit(SocketEvents.ERROR, { message: "Failed to submit answer" });
        }
    }

    /**
     * Handle host ending game
     */
    private async handleEndGame(
        socket: Socket,
        data: { gameSessionId: string }
    ) {
        try {
            const { gameSessionId } = data;

            // Clear timer
            this.clearQuestionTimer(gameSessionId);

            // Update game state
            await this.gameRepo.updateGameState(gameSessionId, GameState.COMPLETED);

            // Get final leaderboard
            const leaderboard = await this.playerRepo.getLeaderboard(gameSessionId);

            // Notify all players
            this.io?.to(gameSessionId).emit(SocketEvents.GAME_ENDED, {
                gameSessionId,
                leaderboard
            });

            console.log(`🏁 Game ${gameSessionId} ended`);
        } catch (error) {
            console.error("❌ Error in handleEndGame:", error);
            socket.emit(SocketEvents.ERROR, { message: "Failed to end game" });
        }
    }

    /**
     * Handle socket disconnect
     */
    private async handleDisconnect(socket: Socket) {
        const { gameSessionId, playerName } = socket.data;

        if (gameSessionId && playerName) {
            console.log(`🔌 Player ${playerName} disconnected from game ${gameSessionId}`);

            const playerCount = await this.getPlayerCount(gameSessionId);
            
            this.io?.to(gameSessionId).emit(SocketEvents.PLAYER_DISCONNECTED, {
                playerName,
                playerCount
            });
        }

        console.log(`🔌 Client disconnected: ${socket.id}`);
    }

    /**
     * Start question timer
     */
    private startQuestionTimer(gameSessionId: string) {
        const timer = setInterval(async () => {
            const game = await this.gameRepo.getSessionById(gameSessionId);
            
            if (!game || !game.questionStartedAt) {
                this.clearQuestionTimer(gameSessionId);
                return;
            }

            // Calculate time left
            const elapsed = Math.floor((Date.now() - game.questionStartedAt.getTime()) / 1000);
            const timeLeft = Math.max(0, (game.questionDuration || 10) - elapsed);

            // Update time in database
            game.timeLeft = timeLeft;
            await this.gameRepo.saveSession(game);

            // Broadcast time update to all clients
            this.io?.to(gameSessionId).emit('time-update', { timeLeft });

            // Time's up
            if (timeLeft <= 0) {
                this.clearQuestionTimer(gameSessionId);
                await this.handleTimeUp(gameSessionId);
            }
        }, 1000);

        this.timers.set(gameSessionId, timer);
        console.log(`⏱️ Timer started for game ${gameSessionId}`);
    }

    /**
     * Clear question timer
     */
    private clearQuestionTimer(gameSessionId: string) {
        const timer = this.timers.get(gameSessionId);
        
        if (timer) {
            clearInterval(timer);
            this.timers.delete(gameSessionId);
            console.log(`⏱️ Timer cleared for game ${gameSessionId}`);
        }
    }

    /**
     * Handle time up
     */
    private async handleTimeUp(gameSessionId: string) {
        try {
            const game = await this.gameRepo.getSessionWithDetails(gameSessionId);
            
            if (!game) return;

            // Update state to TIMEOUT
            await this.gameRepo.updateGameState(gameSessionId, GameState.TIMEOUT);

            // Wait a moment for any last answers
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get leaderboard
            const leaderboard = await this.playerRepo.getLeaderboard(gameSessionId);

            // Get correct answer
            const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
            const correctAnswer = currentQuestion.answers.find(a => a.correctAnswer);

            // Update state to RESULTS_READY
            await this.gameRepo.updateGameState(gameSessionId, GameState.RESULTS_READY);

            // Show results to all players
            this.io?.to(gameSessionId).emit(SocketEvents.QUESTION_RESULTS, {
                leaderboard,
                correctAnswer,
                questionIndex: game.currentQuestionIndex
            });

            console.log(`⏰ Time up for game ${gameSessionId}`);
        } catch (error) {
            console.error("❌ Error in handleTimeUp:", error);
        }
    }

    /**
     * Calculate time left for current question
     */
    private calculateTimeLeft(game: Game): number {
        if (!game.questionStartedAt) {
            return game.questionDuration || 10;
        }

        const elapsed = Math.floor((Date.now() - game.questionStartedAt.getTime()) / 1000);
        return Math.max(0, (game.questionDuration || 10) - elapsed);
    }

    /**
     * Get player count in a room
     */
    private async getPlayerCount(gameSessionId: string): Promise<number> {
        try {
            if (!this.io) return 0;
            
            const room = this.io.sockets.adapter.rooms.get(gameSessionId);
            return room ? room.size : 0;
        } catch (error) {
            console.error("Error getting player count:", error);
            return 0;
        }
    }

    /**
     * Get answer count for current question
     */
    private async getAnswerCount(gameSessionId: string): Promise<number> {
        try {
            const players = await this.playerRepo.getSessionPlayers(gameSessionId);
            return players.filter(p => p.hasAnsweredCurrent).length;
        } catch (error) {
            console.error("Error getting answer count:", error);
            return 0;
        }
    }

    /**
     * Public method to emit events from outside (e.g., from REST API)
     */
    public emitToGame(sessionId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(sessionId).emit(event, data);
        }
    }

    /**
     * Broadcast countdown ticks to all clients
     * This ensures synchronized countdown across all players
     */
    private broadcastCountdown(
        gameSessionId: string,
        countdownStart: number,
        onComplete: () => void
    ) {
        let currentCount = countdownStart;

        const broadcastTick = () => {
            if (currentCount > 0) {
                // Broadcast current countdown number
                this.io?.to(gameSessionId).emit('countdown-tick', {
                    countdown: currentCount
                });
                console.log(`⏳ Countdown: ${currentCount}`);
                
                currentCount--;
                setTimeout(broadcastTick, 1000);
            } else {
                // Countdown finished
                console.log(`✅ Countdown complete for ${gameSessionId}`);
                onComplete();
            }
        };

        // Start broadcasting
        broadcastTick();
    }
}