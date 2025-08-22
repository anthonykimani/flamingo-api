import { Repository } from "typeorm";
import AppDataSource from "../configs/ormconfig";
import { Game } from "../models/game.entity";
import { GameState } from "../enums/GameState";
import dotenv from "dotenv";


export class GameRepository {
    private repo: Repository<Game>;

    constructor() {
        this.repo = AppDataSource.getRepository(Game)
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    /**
     * Save Game
     * @param game Game Data
     * @returns Game
     */
    async saveGame(game: Game): Promise<Game | null> {
        try {
            if (!game.id) {
                game.quiz = game.quiz,
                game.gameTitle = game.gameTitle,
                game.entryFee = game.entryFee,
                game.maxPlayers = game.maxPlayers,
                game.status = GameState.CREATED,
                game.createdAt = new Date(),
                game.gamePlayers = []
            }

            let gameData = await this.repo.save(game);

            return gameData;
        } catch (error) {
            if (error instanceof Error) {
                throw error.message;
            } else {
                throw error;
            }
        }
    }
}