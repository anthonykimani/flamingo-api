import AppDataSource from "../configs/ormconfig";
import { GameState } from "../enums/GameState";
import { Game } from "../models/game.entity";
import { Quiz } from "../models/quiz.entity";
import { GameRepository } from "../repositories/game.repo";
import { PlayerRepository } from "../repositories/player.repo";
import Controller from "./controller";
import { Request, Response } from "express";


class GameController extends Controller {
    /**
     * Get Game List
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async games(req: Request, res: Response) {
        try {
            const repo: GameRepository = new GameRepository();
            let gameData = await repo.getAllGames(req.body);

            if (gameData) {
                return res.send(super.response(super._200, gameData))
            } else {
                return res.send(super.response(super._404, gameData, [super._404.message]))
            }

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)))
        }
    }

    /**
     * Get Game by Id
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async game(req: Request, res: Response) {
        try {
            const repo: GameRepository = new GameRepository();
            let { id } = req.body;

            let gameData = await repo.getGameById(id);

            if (gameData) {
                return res.send(super.response(super._200, gameData))
            } else {
                return res.send(super.response(super._404, gameData, [super._404.message]))
            }

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)))
        }
    }


    /**
     * Add Game
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async add(req: Request, res: Response) {
        try {
            const repo: GameRepository = new GameRepository();
            const quizRepo = AppDataSource.getRepository(Quiz);

            const {
                quizId,
                gameTitle,
                entryFee,
                maxPlayers,
                status,
            } = req.body

            const quiz = await quizRepo.findOneBy({ id: quizId });

            if (!quiz) {
                return res.send(super.response(super._404, null, ["Quiz not found"]));
            }

            let game = new Game();
            game.quiz = quiz,
                game.gameTitle = gameTitle,
                game.entryFee = entryFee,
                game.maxPlayers = maxPlayers,
                game.status = status,
                game.gamePlayers = [];

            let gameData = await repo.saveGame(game);

            return res.send(super.response(super._200, gameData));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Start a GameState from CREATED to WAITING
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async enterGameLobby(req: Request, res: Response) {
        try {
            const { gameId, playerId } = req.body;

            const gameRepo: GameRepository = new GameRepository();
            const playerRepo: PlayerRepository = new PlayerRepository();

            let currentGame = await gameRepo.getGameById(gameId);
            let participant = await playerRepo.getPlayerById(playerId);

            // TODO: add validations for valid currentGame and participant

            if (currentGame && participant) {

                currentGame.status = GameState.WAITING

                currentGame.gamePlayers.push(participant)

                return res.send(super.response(super._200, currentGame));
            } else {
                return res.send(super.response(super._404, null, [super._404.message]))
            }
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)))
        }
    }
}

export default GameController;