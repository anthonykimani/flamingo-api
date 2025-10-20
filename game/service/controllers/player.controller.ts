import { Player } from "../models/player.entity";
import { PlayerAnswerRepository } from "../repositories/player-answer.repo";
import { PlayerRepository } from "../repositories/player.repo";

import Controller from "./controller";
import { Request, Response } from "express";

class PlayerController extends Controller {
    /**
     * Get Player List
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async players(req: Request, res: Response) {
        try {
            const repo: PlayerRepository = new PlayerRepository();
            let playerData = await repo.getAllPlayers(req.body);

            if (playerData) {
                return res.send(super.response(super._200, playerData));
            } else {
                return res.send(super.response(super._404, playerData, [super._404.message]));
            }
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get a Player by Id
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async player(req: Request, res: Response) {
        try {
            const repo: PlayerRepository = new PlayerRepository();
            const { id } = req.params;

            if (!id) {
                return res.send(super.response(super._400, null, ['Player ID is required']));
            }

            let playerData = await repo.getPlayerById(id);

            if (playerData) {
                return res.send(super.response(super._200, playerData));
            } else {
                return res.send(super.response(super._404, null, ['Player not found']));
            }
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Add/Register a Player to Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async add(req: Request, res: Response) {
        try {
            const repo: PlayerRepository = new PlayerRepository();
            const {
                playerName,
                gameSessionId,
                playerId
            } = req.body;

            // Validate required fields
            if (!playerName || !gameSessionId) {
                return res.send(super.response(super._400, null, ['Player name and game session ID are required']));
            }

            
            const existingPlayer = await repo.getPlayerByNameAndSession(gameSessionId, playerName);
            
            if (existingPlayer) {
                return res.send(super.response(super._400, null, ['Player already joined this game']));
            }

            let player = new Player();
            player.playerName = playerName;
            player.gameSession = { id: gameSessionId } as any;
            if (playerId) player.id = playerId;
            player.totalScore = 0;
            player.correctAnswers = 0;
            player.wrongAnswers = 0;
            player.currentStreak = 0;
            player.bestStreak = 0;

            let playerData = await repo.savePlayer(player);

            return res.send(super.response(super._200, playerData));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Update Player Stats
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async updateStats(req: Request, res: Response) {
        try {
            const repo: PlayerRepository = new PlayerRepository();
            const {
                gameSessionId,
                playerName,
                totalScore,
                correctAnswers,
                wrongAnswers,
                currentStreak,
                bestStreak
            } = req.body;

            if (!gameSessionId || !playerName) {
                return res.send(super.response(super._400, null, ['Game session ID and player name are required']));
            }

            const updatedPlayer = await repo.updatePlayerStats({
                gameSessionId,
                playerName,
                totalScore,
                correctAnswers,
                wrongAnswers,
                currentStreak,
                bestStreak
            });

            if (!updatedPlayer) {
                return res.send(super.response(super._404, null, ['Player not found']));
            }

            return res.send(super.response(super._200, updatedPlayer));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get Leaderboard for Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async leaderboard(req: Request, res: Response) {
        try {
            const repo: PlayerRepository = new PlayerRepository();
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
     * Get Player Stats for a Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async playerStats(req: Request, res: Response) {
        try {
            const repo: PlayerRepository = new PlayerRepository();
            const { gameSessionId, playerName } = req.params;

            if (!gameSessionId || !playerName) {
                return res.send(super.response(super._400, null, ['Game session ID and player name are required']));
            }

            const stats = await repo.getPlayerStats(gameSessionId, playerName);

            if (!stats) {
                return res.send(super.response(super._404, null, ['Player not found in this game session']));
            }

            return res.send(super.response(super._200, stats));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get Player's Answer History
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async answerHistory(req: Request, res: Response) {
        try {
            const answerRepo: PlayerAnswerRepository = new PlayerAnswerRepository();
            const { gameSessionId, playerName } = req.params;

            if (!gameSessionId || !playerName) {
                return res.send(super.response(super._400, null, ['Game session ID and player name are required']));
            }

            const answers = await answerRepo.getPlayerAnswers(gameSessionId, playerName);

            return res.send(super.response(super._200, answers));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get All Players in a Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async sessionPlayers(req: Request, res: Response) {
        try {
            const repo: PlayerRepository = new PlayerRepository();
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
     * Remove Player from Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async removePlayer(req: Request, res: Response) {
        try {
            const repo: PlayerRepository = new PlayerRepository();
            const { gameSessionId, playerName } = req.params;

            if (!gameSessionId || !playerName) {
                return res.send(super.response(super._400, null, ['Game session ID and player name are required']));
            }

            const removed = await repo.removePlayer(gameSessionId, playerName);

            if (!removed) {
                return res.send(super.response(super._404, null, ['Player not found']));
            }

            return res.send(super.response(super._200, { message: 'Player removed successfully' }));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get Player Rank in Game Session
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async playerRank(req: Request, res: Response) {
        try {
            const repo: PlayerRepository = new PlayerRepository();
            const { gameSessionId, playerName } = req.params;

            if (!gameSessionId || !playerName) {
                return res.send(super.response(super._400, null, ['Game session ID and player name are required']));
            }

            const rank = await repo.getPlayerRank(gameSessionId, playerName);

            if (!rank) {
                return res.send(super.response(super._404, null, ['Player not found']));
            }

            return res.send(super.response(super._200, rank));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }
}

export default PlayerController;