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

    /**
     * Get all Game
     * @param game Game Data
     * @returns Game
     */
    async getAllGames(
        game?: Game,
        skip?: number,
        take?: number
    ) {
        try {
            let gameData: Game[] = [];

            if(!gameData || Object.keys(gameData).length === 0) {
                gameData = await this.repo.find({
                    where: {
                        status: GameState.CREATED,
                    },
                });
            } else {
                gameData = await this.repo.find({
                    where: [
                        { id: game?.id },
                        { quiz: game?.quiz },
                        { gameTitle: game?.gameTitle },
                        { entryFee: "10" },
                        { maxPlayers: 5 },
                        { status: GameState.CREATED },
                        { createdAt: new Date() },
                    ],
                    order: {
                        createdAt: "DESC",
                    }
                })
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error.message;
            } else {
                throw error;
            }            
        }
    }
}