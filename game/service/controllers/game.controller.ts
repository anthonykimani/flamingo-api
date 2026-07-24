import { GameRepository } from "../repositories/game.repo";
import { PlayerAnswerRepository } from "../repositories/player-answer.repo";
import { PlayerRepository } from "../repositories/player.repo";
import { Player } from "../models/player.entity";
import { GameMode } from "../enums/GameMode";
import Controller from "./controller";
import { Request, Response } from "express";
import { signGuestToken } from "../utils/tokens";
import { submitAnswerForPlayer } from "../utils/gameplay";

const RESERVED_NAMES = ["host", "spectator"];

/** True when the authenticated wallet owns this game session */
function isHost(session: { hostAddress?: string }, address?: string): boolean {
    return !!session.hostAddress && !!address && session.hostAddress.toLowerCase() === address.toLowerCase();
}

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
            const { quizId, gameMode, hasPrizes, entryFee } = req.body;

            if (!quizId) {
                return res.send(super.response(super._400, null, ['Quiz ID is required']));
            }

            const hostAddress = req.user?.address?.toLowerCase();
            if (!hostAddress) {
                return res.send(super.response(super._401, null, ['Authenticated wallet required to create a game']));
            }

            const session = await repo.createSession(quizId, 10, gameMode, hasPrizes, entryFee, hostAddress);

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
     * Join Game by PIN — creates the player server-side and issues a
     * short-lived guest token binding the caller to that player identity.
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async joinGame(req: Request, res: Response) {
        try {
            const repo = new GameRepository();
            const playerRepo = new PlayerRepository();
            const { gamePin, playerName, walletAddress } = req.body;

            if (!gamePin) {
                return res.send(super.response(super._400, null, ['Game PIN is required']));
            }

            if (!playerName || typeof playerName !== "string" || playerName.trim().length < 2 || playerName.trim().length > 20) {
                return res.send(super.response(super._400, null, ['Player name must be 2-20 characters']));
            }

            const trimmedName = playerName.trim();

            if (RESERVED_NAMES.includes(trimmedName.toLowerCase())) {
                return res.send(super.response(super._400, null, ['That name is reserved']));
            }

            const session = await repo.getSessionByPin(gamePin);

            if (!session) {
                return res.send(super.response(super._404, null, ['Game not found']));
            }

            if (!session.isActive) {
                return res.send(super.response(super._400, null, ['Game is no longer active']));
            }

            // Degen PvP games stake real deposits — a wallet is mandatory
            if (session.gameMode === GameMode.DEGEN_PVP && !walletAddress) {
                return res.send(super.response(super._400, null, ['Wallet address required to join this game']));
            }

            const normalizedWallet = typeof walletAddress === "string" && walletAddress
                ? walletAddress.toLowerCase()
                : undefined;

            let player = await playerRepo.getPlayerByNameAndSession(session.id, trimmedName);

            if (player) {
                // Rejoin: a wallet-bound identity can only be reclaimed by the same wallet
                if (player.walletAddress && player.walletAddress.toLowerCase() !== normalizedWallet) {
                    return res.send(super.response(super._409, null, ['That name is taken in this game']));
                }
            } else {
                player = new Player();
                player.playerName = trimmedName;
                player.walletAddress = normalizedWallet;
                player.gameSession = { id: session.id } as any;
                player.totalScore = 0;
                player.correctAnswers = 0;
                player.wrongAnswers = 0;
                player.currentStreak = 0;
                player.bestStreak = 0;
                player.hasAnsweredCurrent = false;
                player.hasDeposited = false;

                player = await playerRepo.savePlayer(player);
            }

            const token = signGuestToken({
                playerId: player.id,
                playerName: player.playerName,
                gameSessionId: session.id,
            });

            return res.send(super.response(super._200, { session, player, token }));
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

            const existing = await repo.getSessionById(gameSessionId);
            if (!existing) {
                return res.send(super.response(super._404, null, ['Game session not found']));
            }

            if (!isHost(existing, req.user?.address)) {
                return res.send(super.response(super._403, null, ['Only the game host can start this game']));
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

            const existing = await repo.getSessionById(gameSessionId);
            if (!existing) {
                return res.send(super.response(super._404, null, ['Game session not found']));
            }

            if (!isHost(existing, req.user?.address)) {
                return res.send(super.response(super._403, null, ['Only the game host can update this game']));
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
            // Guest tokens pin the identity — clients cannot claim another player's name
            const gameSessionId = req.guest ? req.guest.gameSessionId : req.body.gameSessionId;
            const playerName = req.guest ? req.guest.playerName : req.body.playerName;

            const { questionId, answerId, timeToAnswer } = req.body;

            if (!gameSessionId || !playerName || !questionId || !answerId) {
                return res.send(super.response(super._400, null, ['Missing required fields']));
            }

            // Wallet path: the caller may only answer as a player bound to
            // their own wallet (prevents hijacking another player's score).
            if (!req.guest && req.user?.address) {
                const playerRepo = new PlayerRepository();
                const claimed = await playerRepo.getPlayerByNameAndSession(gameSessionId, playerName);
                if (claimed?.walletAddress && claimed.walletAddress.toLowerCase() !== req.user.address.toLowerCase()) {
                    return res.send(super.response(super._403, null, ['That player is bound to a different wallet']));
                }
            }

            const result = await submitAnswerForPlayer({
                gameSessionId,
                playerName,
                questionId,
                answerId,
                timeToAnswer: timeToAnswer || 0
            });

            if (!result.ok) {
                const status = result.status === 404 ? super._404 : result.status === 400 ? super._400 : super._500;
                return res.send(super.response(status, null, [result.message]));
            }

            return res.send(super.response(super._200, {
                answer: result.answer,
                player: result.player,
                isCorrect: result.isCorrect,
                pointsEarned: result.pointsEarned
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
     * Get Active/Joinable Game Sessions
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async getActiveGames(req: Request, res: Response) {
        try {
            const repo = new GameRepository();
            const sessions = await repo.getActiveSessions();

            const joinable = sessions
                .filter(s => s.status === 'waiting' || s.status === 'created')
                .map(s => ({
                    id: s.id,
                    gamePin: s.gamePin,
                    gameTitle: s.gameTitle || s.quiz?.title || 'Untitled Quiz',
                    gameMode: s.gameMode || 'hangouts',
                    playerCount: s.players?.length || 0,
                    maxPlayers: s.maxPlayers,
                    createdAt: s.createdAt
                }));

            return res.send(super.response(super._200, joinable));
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

            const existing = await repo.getSessionById(gameSessionId);
            if (!existing) {
                return res.send(super.response(super._404, null, ['Game session not found']));
            }

            if (!isHost(existing, req.user?.address)) {
                return res.send(super.response(super._403, null, ['Only the game host can end this game']));
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

            const existing = await repo.getSessionById(gameSessionId);
            if (!existing) {
                return res.send(super.response(super._404, null, ['Game session not found']));
            }

            if (!isHost(existing, req.user?.address)) {
                return res.send(super.response(super._403, null, ['Only the game host can delete this game']));
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