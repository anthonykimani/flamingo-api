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
     * @param player Player data
     * @returns Player
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

    /**
     * Get All Players
     * @param player 
     * @return Player List
     */
    async getAllPlayers(
        player?: Player,
        skip?: number,
        take?: number
    ) {
        try {
            let playerData: Player[] = [];

            if (!player || Object.keys(player).length === 0) {
                playerData = await this.repo.find({
                    where: {
                        isActive: true,
                    },
                });
            } else {
                playerData = await this.repo.find({
                    where: [
                        { id: player.id },
                        { address: player.address },
                        { userId: player.userId },
                        { game: player.game },
                        { gameId: player.gameId },
                        { answers: player.answers },
                        { score: player.score },
                        { isWinner: player.isWinner },
                        { isActive: player.isActive },
                        { joinedAt: player.joinedAt }
                    ],
                    order: {
                        joinedAt: "DESC",
                    }
                })
            }

            return playerData;
        } catch (error) {
            if (error instanceof Error) {
                throw error.message;
            } else {
                throw error;
            }
        }
    }

    /**
     * Get a Player by Id
     * @param id
     * @return Player
     */
    async getPlayerById(id: string): Promise<Player | null> {
        try {
            if(!id) return null;

            let playerData = await this.repo.find({
                where: [{ id: id }],
                take: 1,
            });
            
            return playerData && playerData.length > 0 ? playerData[0] : null;
        } catch (error) {
            if (error instanceof Error) {
                throw error.message;
            } else {
                throw error;
            }
        }
    }
}