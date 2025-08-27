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
}