import AppDataSource from "../configs/ormconfig";
import { GameState } from "../enums/GameState";
import { Game } from "../models/game.entity";
import { Quiz } from "../models/quiz.entity";
import { GameRepository } from "../repositories/game.repo";
import { PlayerAnswerRepository } from "../repositories/player-answer.repo";
import { PlayerRepository } from "../repositories/player.repo";
import Controller from "./controller";
import { Request, Response } from "express";

class GameController extends Controller {
    /**
     * Create Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async createSession(req: Request, res: Response) {
        try {
            const repo = new GameRepository();
            const { quizId } = req.body;

            if (!quizId) {
                return res.send(super.response(super._400, null, ['Quiz ID is required']));
            }

            const session = await repo.createSession(quizId);

            return res.send(super.response(super._200, session));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get Game Session by ID
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async getSession(req: Request, res: Response) {
        try {
            const repo = new GameRepository();
            const { gameSessionId } = req.params;

            if (!gameSessionId) {
                return res.send(super.response(super._400, null, ['Game session ID is required']));
            }

            const session = await repo.getSessionById(gameSessionId);

            if (!session) {
                return res.send(super.response(super._404, null, ['Game session not found']));
            }

            return res.send(super.response(super._200, session));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }


    /**
     * Get Game Session by GamePin
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async getGameSessionByGamePin(req: Request, res: Response) {
        try {
            const repo = new GameRepository();
            const { gamePinId } = req.params;

            if (!gamePinId) {
                return res.send(super.response(super._400, null, ["Game Pin not found"]))
            }

            const gameSession = await repo.getSessionByPin(gamePinId);

            if (!gameSession) {
                return res.send(super.response(super._404, null, ['Game session not found']))
            }

            return res.send(super.response(super._200, gameSession));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Join Game by PIN
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async joinGame(req: Request, res: Response) {
        try {
            const repo = new GameRepository();
            const { gamePin } = req.body;

            if (!gamePin) {
                return res.send(super.response(super._400, null, ['Game PIN is required']));
            }

            const session = await repo.getSessionByPin(gamePin);

            if (!session) {
                return res.send(super.response(super._404, null, ['Game not found']));
            }

            if (!session.isActive) {
                return res.send(super.response(super._400, null, ['Game is no longer active']));
            }

            return res.send(super.response(super._200, session));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Start Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async startGame(req: Request, res: Response) {
        try {
            const repo = new GameRepository();
            const { gameSessionId } = req.params;
            const { gameState } = req.body;

            if (!gameSessionId) {
                return res.send(super.response(super._400, null, ['Game session ID is required']));
            }

            if (!gameState) {
                return res.send(super.response(super._400, null, ['Game state is required']))
            }

            const session = await repo.startSession(gameSessionId);

            if (!session) {
                return res.send(super.response(super._404, null, ['Game session not found']));
            }

            return res.send(super.response(super._200, session));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Update Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async updateGame(req: Request, res: Response) {
        try {
            const repo = new GameRepository();
            const { gameSessionId } = req.params;
            const { gameState } = req.body;

            if (!gameSessionId) {
                return res.send(super.response(super._400, null, ['Game session ID is required']));
            }

            if (!gameState) {
                return res.send(super.response(super._400, null, ['Game state is required']))
            }

            const updateGameSession = await repo.updateSession(gameSessionId, gameState);

            return res.send(super.response(super._200, updateGameSession));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)))
        }
    }

    /**
     * Submit Player Answer
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async submitAnswer(req: Request, res: Response) {
        try {
            const answerRepo = new PlayerAnswerRepository();
            const playerRepo = new PlayerRepository();

            const {
                gameSessionId,
                playerName,
                questionId,
                answerId,
                isCorrect,
                pointsEarned,
                answerStreak,
                timeToAnswer
            } = req.body;

            // Validate required fields
            if (!gameSessionId || !playerName || !questionId || !answerId) {
                return res.send(super.response(super._400, null, ['Missing required fields']));
            }

            // FIX: Use correct method name - getPlayerQuestionAnswer
            const existingAnswer = await answerRepo.getPlayerQuestionAnswer(
                gameSessionId,
                playerName,
                questionId
            );

            if (existingAnswer) {
                return res.send(super.response(super._400, null, ['You have already answered this question']));
            }

            // FIX: Use correct parameter format - plain object, not relation objects
            const playerAnswer = await answerRepo.saveAnswer({
                gameSessionId,
                playerName,
                questionId,
                answerId,
                isCorrect,
                pointsEarned: pointsEarned || 0,
                answerStreak: answerStreak || 0,
                timeToAnswer: timeToAnswer || 0
            });

            // Update player stats
            const player = await playerRepo.getPlayerByNameAndSession(gameSessionId, playerName);

            if (player) {
                player.totalScore = (player.totalScore || 0) + (pointsEarned || 0);
                
                if (isCorrect) {
                    player.correctAnswers = (player.correctAnswers || 0) + 1;
                    player.currentStreak = (answerStreak || 0);
                    player.bestStreak = Math.max(player.bestStreak || 0, answerStreak || 0);
                } else {
                    player.wrongAnswers = (player.wrongAnswers || 0) + 1;
                    player.currentStreak = 0;
                }

                await playerRepo.savePlayer(player);
            }

            return res.send(super.response(super._200, {
                answer: playerAnswer,
                player: player
            }));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get Leaderboard
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async getLeaderboard(req: Request, res: Response) {
        try {
            const repo = new PlayerRepository();
            const { gameSessionId } = req.params;

            if (!gameSessionId) {
                return res.send(super.response(super._400, null, ['Game session ID is required']));
            }

            const leaderboard = await repo.getLeaderboard(gameSessionId);

            return res.send(super.response(super._200, leaderboard));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get Player Stats
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async getPlayerStats(req: Request, res: Response) {
        try {
            const repo = new PlayerRepository();
            const { gameSessionId, playerName } = req.params;

            if (!gameSessionId || !playerName) {
                return res.send(super.response(super._400, null, ['Missing required parameters']));
            }

            const stats = await repo.getPlayerStats(gameSessionId, playerName);

            if (!stats) {
                return res.send(super.response(super._404, null, ['Player not found']));
            }

            return res.send(super.response(super._200, stats));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get All Active Players in Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async getActivePlayers(req: Request, res: Response) {
        try {
            const repo = new PlayerRepository();
            const { gameSessionId } = req.params;

            if (!gameSessionId) {
                return res.send(super.response(super._400, null, ['Game session ID is required']));
            }

            const players = await repo.getSessionPlayers(gameSessionId);

            return res.send(super.response(super._200, players));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get Question Statistics (how many players answered)
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async getQuestionStats(req: Request, res: Response) {
        try {
            const answerRepo = new PlayerAnswerRepository();
            const { gameSessionId, questionId } = req.params;

            if (!gameSessionId || !questionId) {
                return res.send(super.response(super._400, null, ['Missing required parameters']));
            }

            const answers = await answerRepo.getQuestionAnswers(gameSessionId, questionId);

            const totalAnswers = answers.length;
            const correctCount = answers.filter((ans: any) => ans.isCorrect).length;
            const wrongCount = answers.filter((ans: any) => !ans.isCorrect).length;

            // FIX: Add type annotation for reduce accumulator
            interface AnswerBreakdown {
                [key: string]: {
                    answerId: string;
                    answerText: string;
                    count: number;
                    isCorrect: boolean;
                };
            }

            // Group by selected answer
            const answerBreakdown = answers.reduce<AnswerBreakdown>((acc, ans) => {
                const answerId = ans.selectedAnswer.id;
                if (!acc[answerId]) {
                    acc[answerId] = {
                        answerId,
                        answerText: ans.selectedAnswer.answer,
                        count: 0,
                        isCorrect: ans.selectedAnswer.correctAnswer
                    };
                }
                acc[answerId].count++;
                return acc;
            }, {});

            const stats = {
                totalAnswers,
                correctCount,
                wrongCount,
                correctPercentage: totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0,
                answerBreakdown: Object.values(answerBreakdown)
            };

            return res.send(super.response(super._200, stats));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get Game Session Summary
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async getSessionSummary(req: Request, res: Response) {
        try {
            const gameRepo = new GameRepository();
            const playerRepo = new PlayerRepository();
            const answerRepo = new PlayerAnswerRepository();
            const { gameSessionId } = req.params;

            if (!gameSessionId) {
                return res.send(super.response(super._400, null, ['Game session ID is required']));
            }

            const session = await gameRepo.getSessionById(gameSessionId);
            if (!session) {
                return res.send(super.response(super._404, null, ['Game session not found']));
            }

            const players = await playerRepo.getSessionPlayers(gameSessionId);
            const leaderboard = await playerRepo.getLeaderboard(gameSessionId);
            
            // FIX: Use correct method name - getGameAnswers
            const allAnswers = await answerRepo.getGameAnswers(gameSessionId);

            const summary = {
                session: {
                    id: session.id,
                    gamePin: session.gamePin,
                    quizTitle: session.quiz?.title,
                    isActive: session.isActive,
                    startedAt: session.startedAt,
                    endedAt: session.endedAt
                },
                stats: {
                    totalPlayers: players.length,
                    totalAnswers: allAnswers.length,
                    averageScore: players.length > 0
                        ? players.reduce((sum, p) => sum + p.totalScore, 0) / players.length
                        : 0,
                    correctAnswersTotal: allAnswers.filter((ans: any) => ans.isCorrect).length,
                    wrongAnswersTotal: allAnswers.filter((ans: any) => !ans.isCorrect).length
                },
                topPlayers: leaderboard.slice(0, 3),
                allPlayers: leaderboard
            };

            return res.send(super.response(super._200, summary));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * End Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async endSession(req: Request, res: Response) {
        try {
            const repo = new GameRepository();
            const { gameSessionId } = req.params;

            if (!gameSessionId) {
                return res.send(super.response(super._400, null, ['Game session ID is required']));
            }

            const session = await repo.endSession(gameSessionId);

            if (!session) {
                return res.send(super.response(super._404, null, ['Game session not found']));
            }

            return res.send(super.response(super._200, session));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Delete Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async deleteSession(req: Request, res: Response) {
        try {
            const repo = new GameRepository();
            const { gameSessionId } = req.params;

            if (!gameSessionId) {
                return res.send(super.response(super._400, null, ['Game session ID is required']));
            }

            const deleted = await repo.deleteSession(gameSessionId);

            if (!deleted) {
                return res.send(super.response(super._404, null, ['Game session not found']));
            }

            return res.send(super.response(super._200, { message: 'Game session deleted successfully' }));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }
}

export default GameController;