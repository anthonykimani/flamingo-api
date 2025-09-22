import { Player } from "../models/player.entity";
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
                return res.send(super.response(super._200, playerData))
            } else {
                return res.send(super.response(super._404, playerData, [super._404.message]))
            }
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)))
        }
    }

    /**
     * Get a Player by Id
     * @param req Request
     * @param res Respond
     * @returns Json Object
     */
    public static async player(req: Request, res: Response) {
        try {
            const repo: PlayerRepository = new PlayerRepository();
            const { id } = req.body;

            let playerData = await repo.getPlayerById(id);

            if (playerData) {
                return res.send(super.response(super._200, playerData))
            } else {
                return res.send(super.response(super._404, null, [super._404.message]))
            }

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)))
        }
    }

    /**
     * Add a Player
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async add(req: Request, res: Response) {
        try {
            const repo: PlayerRepository = new PlayerRepository();
            const {
                address,
                userId,
                gameId,
                score,
                isWinner,
                isActive,
            } = req.body;

            let player = new Player();
            player.address = address,
                player.userId = userId,
                player.gameId = gameId,
                player.score = score,
                player.isWinner = isWinner,
                player.isActive = isActive

            let playerData = await repo.savePlayer(player);

            return res.send(super.response(super._200, playerData))
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }
}

export default PlayerController;