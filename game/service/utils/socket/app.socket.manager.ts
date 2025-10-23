import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { GameRepository } from "../../repositories/game.repo";
import { PlayerRepository } from "../../repositories/player.repo";
import { PlayerAnswerRepository } from "../../repositories/player-answer.repo";
import { Exception } from "../exceptions/Exception";
import { SocketEvents } from "../../enums/SocketEvents";
import Validator from "../validators/validator";
import { GameState } from "../../enums/GameState";

interface PlayerSocket {
    socketId: string;
    playerName: string;
    gameSessionId: string;
}

export class SocketService {
    private static instance: SocketService;
    private io: SocketServer | null = null;
    private gameRepo: GameRepository = new GameRepository();
    private playerRepo: PlayerRepository = new PlayerRepository();
    private playerAnswerRepo: PlayerAnswerRepository = new PlayerAnswerRepository();
    
    // Track connected players
    private connectedPlayers: Map<string, PlayerSocket> = new Map();
    // Track game rooms
    private gameRooms: Map<string, Set<string>> = new Map();

    private constructor() {}

    static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    initialize(httpServer: HttpServer, allowedOrigins: string[]) {
        try {
            if (!this.io) {
                this.io = new SocketServer(httpServer, {
                    cors: {
                        origin: allowedOrigins,
                        methods: ["GET", "POST"],
                        credentials: false
                    },
                    transports: ['websocket', 'polling']
                });

                if (this.io) {
                    this.setupEventListeners();
                    console.log('Socket.IO initialized successfully');
                }
            }

            return this.io;
        } catch (error) {
            new Exception(
                "Failed to initialize Socket.IO",
                500,
                "major",
                error,
                "initialize"
            );
            throw error;
        }
    }

    getIO(): SocketServer {
        if (!this.io) {
            throw new Error("Socket.IO has not been initialized. Please call initialize() first.");
        }
        return this.io;
    }

    private setupEventListeners() {
        if (!this.io) {
            return;
        }

        this.io.on(SocketEvents.CONNECTION, async (socket: Socket) => {
            console.log(`Client connected: ${socket.id}`);

            // Handle player joining a game
            socket.on('join-game', async (data: { gameSessionId: string; playerName: string }) => {
                await this.handleJoinGame(socket, data);
            });

            // Handle host starting the game
            socket.on('start-game', async (data: { gameSessionId: string }) => {
                await this.handleStartGame(socket, data);
            });

            // Handle moving to next question
            socket.on('next-question', async (data: { gameSessionId: string; questionIndex: number }) => {
                await this.handleNextQuestion(socket, data);
            });

            // Handle answer submission
            socket.on('submit-answer', async (data: {
                gameSessionId: string;
                playerName: string;
                questionId: string;
                answerId: string;
                timeToAnswer: number;
            }) => {
                await this.handleSubmitAnswer(socket, data);
            });

            // Handle showing question results
            socket.on('show-results', async (data: { gameSessionId: string; questionId: string }) => {
                await this.handleShowResults(socket, data);
            });

            // Handle game end
            socket.on('end-game', async (data: { gameSessionId: string }) => {
                await this.handleEndGame(socket, data);
            });

            // Handle player leaving
            socket.on('leave-game', async (data: { gameSessionId: string; playerName: string }) => {
                await this.handleLeaveGame(socket, data);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });

            // Handle ping/heartbeat
            socket.on('ping', () => {
                socket.emit('pong');
            });
        });
    }

    private async handleJoinGame(
        socket: Socket,
        data: { gameSessionId: string; playerName: string }
    ) {
        try {
            const { gameSessionId, playerName } = data;

            // Validate input
            if (Validator.isEmpty(gameSessionId) || Validator.isEmpty(playerName)) {
                socket.emit('error', { message: 'Game session ID and player name are required' });
                return;
            }

            // Get game session
            const game = await this.gameRepo.getSessionById(gameSessionId);
            if (!game) {
                socket.emit('error', { message: 'Game session not found' });
                return;
            }

            // Check if game has already started
            // if (game.status !== GameState.WAITING) {
            //     socket.emit('error', { message: 'Game has already started' });
            //     return;
            // }

            // Join the socket room
            socket.join(gameSessionId);

            // Track the player
            this.connectedPlayers.set(socket.id, {
                socketId: socket.id,
                playerName,
                gameSessionId
            });

            // Add to game room tracking
            if (!this.gameRooms.has(gameSessionId)) {
                this.gameRooms.set(gameSessionId, new Set());
            }
            this.gameRooms.get(gameSessionId)?.add(socket.id);

            // Get updated player list
            const players = await this.playerRepo.getSessionPlayers(gameSessionId);

            // Notify all players in the room
            this.io?.to(gameSessionId).emit('player-joined', {
                playerName,
                players: players,
                totalPlayers: players.length
            });

            // Send confirmation to the joining player
            socket.emit('joined-game', {
                gameSessionId,
                playerName,
                game
            });

            console.log(`Player ${playerName} joined game ${gameSessionId}`);
        } catch (error) {
            console.error('Error in handleJoinGame:', error);
            socket.emit('error', { message: 'Failed to join game' });
        }
    }

    private async handleStartGame(
        socket: Socket,
        data: { gameSessionId: string }
    ) {
        try {
            const { gameSessionId } = data;

            // Update game state
            const game = await this.gameRepo.startSession(gameSessionId);
            
            if (!game) {
                socket.emit('error', { message: 'Failed to start game' });
                return;
            }

            // Get first question
            const questions = game.quiz?.questions || [];
            const firstQuestion = questions[0];

            // Notify all players that the game is starting
            this.io?.to(gameSessionId).emit('game-started', {
                gameSessionId,
                currentQuestionIndex: 0,
                question: firstQuestion,
                totalQuestions: questions.length
            });

            console.log(`Game ${gameSessionId} started`);
        } catch (error) {
            console.error('Error in handleStartGame:', error);
            socket.emit('error', { message: 'Failed to start game' });
        }
    }

    private async handleNextQuestion(
        socket: Socket,
        data: { gameSessionId: string; questionIndex: number }
    ) {
        try {
            const { gameSessionId, questionIndex } = data;

            const game = await this.gameRepo.getSessionById(gameSessionId);
            if (!game) {
                socket.emit('error', { message: 'Game not found' });
                return;
            }

            const questions = game.quiz?.questions || [];
            
            if (questionIndex >= questions.length) {
                // No more questions, end the game
                await this.handleEndGame(socket, { gameSessionId });
                return;
            }

            const currentQuestion = questions[questionIndex];

            // Broadcast the next question to all players
            this.io?.to(gameSessionId).emit('next-question', {
                questionIndex,
                question: currentQuestion,
                totalQuestions: questions.length
            });

            console.log(`Game ${gameSessionId} moved to question ${questionIndex}`);
        } catch (error) {
            console.error('Error in handleNextQuestion:', error);
            socket.emit('error', { message: 'Failed to load next question' });
        }
    }

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

            // Get the game and question
            const game = await this.gameRepo.getSessionById(gameSessionId);
            if (!game) {
                socket.emit('error', { message: 'Game not found' });
                return;
            }

            // Find the question and check if answer is correct
            const question = game.quiz?.questions?.find(q => q.id === questionId);
            if (!question) {
                socket.emit('error', { message: 'Question not found' });
                return;
            }

            const correctAnswer = question.answers?.find(a => a.correctAnswer);
            const isCorrect = correctAnswer?.id === answerId;

            // Calculate points (you can adjust the formula)
            const basePoints = 1000;
            const timeBonus = Math.max(0, 500 - (timeToAnswer / 10)); // Faster = more points
            const pointsEarned = isCorrect ? Math.round(basePoints + timeBonus) : 0;

            // Get player's current stats
            const player = await this.playerRepo.getPlayerByNameAndSession(gameSessionId, playerName);
            const playerAnswers = await this.playerAnswerRepo.getPlayerAnswers(gameSessionId, playerName);
            
            const correctAnswersCount = playerAnswers.filter(a => a.isCorrect).length;
            const answerStreak = isCorrect ? correctAnswersCount + 1 : 0;

            // Save the answer
            await this.playerAnswerRepo.saveAnswer({
                gameSession: { id: gameSessionId } as any,
                playerName,
                question: { id: questionId } as any,
                selectedAnswer: { id: answerId } as any,
                isCorrect,
                pointsEarned,
                answerStreak,
                timeToAnswer
            });

            // Update player's stats
            if (player) {
                await this.playerRepo.updatePlayerStats({
                    gameSessionId,
                    playerName,
                    totalScore: (player.totalScore || 0) + pointsEarned,
                    correctAnswers: isCorrect ? (player.correctAnswers || 0) + 1 : player.correctAnswers,
                    wrongAnswers: !isCorrect ? (player.wrongAnswers || 0) + 1 : player.wrongAnswers,
                    currentStreak: answerStreak,
                    bestStreak: Math.max(player.bestStreak || 0, answerStreak)
                });
            }

            // Notify the player
            socket.emit('answer-submitted', {
                isCorrect,
                pointsEarned,
                answerStreak,
                correctAnswerId: correctAnswer?.id
            });

            // Notify the host/room about the submission
            socket.to(gameSessionId).emit('player-answered', {
                playerName,
                answered: true
            });

            console.log(`Player ${playerName} submitted answer for question ${questionId}`);
        } catch (error) {
            console.error('Error in handleSubmitAnswer:', error);
            socket.emit('error', { message: 'Failed to submit answer' });
        }
    }

    private async handleShowResults(
        socket: Socket,
        data: { gameSessionId: string; questionId: string }
    ) {
        try {
            const { gameSessionId, questionId } = data;

            // Get question statistics
            const questionAnswers = await this.playerAnswerRepo.getQuestionAnswers(gameSessionId, questionId);
            
            const stats = {
                totalAnswers: questionAnswers.length,
                correctAnswers: questionAnswers.filter(a => a.isCorrect).length,
                wrongAnswers: questionAnswers.filter(a => !a.isCorrect).length,
                averageTime: questionAnswers.length > 0 
                    ? questionAnswers.reduce((sum, a) => sum + (a.timeToAnswer || 0), 0) / questionAnswers.length 
                    : 0
            };
            
            // Get current leaderboard
            const leaderboard = await this.playerRepo.getLeaderboard(gameSessionId);

            // Broadcast results to all players
            this.io?.to(gameSessionId).emit('question-results', {
                questionId,
                stats,
                leaderboard
            });

            console.log(`Showing results for question ${questionId} in game ${gameSessionId}`);
        } catch (error) {
            console.error('Error in handleShowResults:', error);
            socket.emit('error', { message: 'Failed to show results' });
        }
    }

    private async handleEndGame(
        socket: Socket,
        data: { gameSessionId: string }
    ) {
        try {
            const { gameSessionId } = data;

            // Update game state
            await this.gameRepo.endSession(gameSessionId);

            // Get final leaderboard
            const leaderboard = await this.playerRepo.getLeaderboard(gameSessionId);

            // Get game session data for summary
            const game = await this.gameRepo.getSessionById(gameSessionId);
            
            const summary = {
                gamePin: game?.gamePin,
                totalPlayers: leaderboard.length,
                totalQuestions: game?.quiz?.questions?.length || 0,
                startedAt: game?.startedAt,
                endedAt: game?.endedAt
            };

            // Notify all players
            this.io?.to(gameSessionId).emit('game-ended', {
                leaderboard,
                summary
            });

            console.log(`Game ${gameSessionId} ended`);
        } catch (error) {
            console.error('Error in handleEndGame:', error);
            socket.emit('error', { message: 'Failed to end game' });
        }
    }

    private async handleLeaveGame(
        socket: Socket,
        data: { gameSessionId: string; playerName: string }
    ) {
        try {
            const { gameSessionId, playerName } = data;

            // Leave the room
            socket.leave(gameSessionId);

            // Remove from tracking
            this.connectedPlayers.delete(socket.id);
            this.gameRooms.get(gameSessionId)?.delete(socket.id);

            // Get updated player list
            const players = await this.playerRepo.getSessionPlayers(gameSessionId);

            // Notify others
            socket.to(gameSessionId).emit('player-left', {
                playerName,
                players,
                totalPlayers: players.length
            });

            console.log(`Player ${playerName} left game ${gameSessionId}`);
        } catch (error) {
            console.error('Error in handleLeaveGame:', error);
        }
    }

    private handleDisconnect(socket: Socket) {
        const playerInfo = this.connectedPlayers.get(socket.id);
        
        if (playerInfo) {
            const { gameSessionId, playerName } = playerInfo;
            
            // Notify others in the room
            socket.to(gameSessionId).emit('player-disconnected', {
                playerName
            });

            // Clean up
            this.connectedPlayers.delete(socket.id);
            this.gameRooms.get(gameSessionId)?.delete(socket.id);

            console.log(`Player ${playerName} disconnected from game ${gameSessionId}`);
        }

        console.log(`Client disconnected: ${socket.id}`);
    }

    // Utility method to emit to a specific game room
    emitToGame(gameSessionId: string, event: string, data: any) {
        this.io?.to(gameSessionId).emit(event, data);
    }

    // Utility method to get connected players count for a game
    getGamePlayersCount(gameSessionId: string): number {
        return this.gameRooms.get(gameSessionId)?.size || 0;
    }
}

export default SocketService.getInstance();