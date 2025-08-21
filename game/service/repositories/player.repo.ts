import { Repository } from "typeorm";
import AppDataSource from "../configs/ormconfig";
import { Player } from "../models/player.entity";
import dotenv from "dotenv";

export class PlayerRepository {
    private repo: Repository<Player>;

    constructor() {
        this.repo = AppDataSource.getRepository(Player)
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    /**
     * Save Player
     * @param 
     * @returns
     */
    async savePlayer(player: Player): Promise<Player | null> {
        try {
            if (!player.id) {
                player.address = player.address;
                player.userId = player.userId;
                player.game = player.game;
                player.gameId = player.gameId;
                player.answers = player.answers;
                player.score = 0;
                player.isWinner = false;
                player.joinedAt = new Date();
            }

            let playerData = await this.repo.save(player)

            return playerData;
        } catch (error: any) {
            if (error instanceof Error) {
                throw error.message;
            } else {
                throw error;
            }
        }
    }

    
}