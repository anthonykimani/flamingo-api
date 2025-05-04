import { Request, Response } from "express";
import Controller from "./controller";
import { GameRepository } from "../repositories/game.repo";
import { Game } from "../models/game.entity";
import Validator from "../utils/validators/validator";


class GameController extends Controller {
    /**
     * Get the Games List
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async games(req: Request, res: Response) {
        try {
            const repo: GameRepository = new GameRepository();
            let gameData = await repo.getAll(req.body);

            if (gameData) {
                return res.send(super.response(super._200, gameData));
            } else {
                return res.send(super.response(super._404, gameData, [super._404.message]))
            }
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get Game by ID
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async game(req: Request, res: Response) {
        try {
            const repo: GameRepository = new GameRepository();
            const { id } = req.params;

            let isValid: string[] = [];

            if (!id) {
                isValid.push("The field 'id' is required");
            }

            if (isValid.length == 0) {
                let gameData = await repo.getById(id);

                if (gameData) {
                    return res.send(super.response(super._200, gameData));
                } else {
                    return res.send(super.response(super._404, gameData, [super._404.message]))
                }
            }
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    public static async add(req: Request, res: Response) {
        try {
            const repo: GameRepository = new GameRepository();
            const {
                quizId,
                gameTitle,
                address,
                entryFee,
                maxPlayers,
                status,
            } = req.body;

            let game = new Game();

            game.quizId = quizId;
            game.gameTitle = gameTitle;
            game.address = address;
            game.entryFee = entryFee;
            game.maxPlayers = maxPlayers;
            game.status = status;

            let isValid = Validator.isValidGame(game);
            let gameData = await repo.getById()
        } catch (error) {
            
        }
    }

}