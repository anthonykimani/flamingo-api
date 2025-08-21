import { Repository } from "typeorm";
import { Player } from "../models/player.entity";
import AppDataSource from "../configs/ormconfig";


export class PlayerRepository {
    private playerRepo: Repository<Player>

    constructor() {
        this.playerRepo = AppDataSource.getRepository(Player)
    }

    /**
     * 
     * @param player 
     * @returns 
     */
    async createPlayer(player: Player): Promise<Player | undefined> {
        try {
            if (!player.id) {
                player.address = player.address;
                player.userId = player.userId;
                player.game = player.game;
                player.gameId = player.gameId;
                player.answers = player.answers;
                player.score = player.score;
                player.isWinner = player.isWinner;
                player.joinedAt = player.joinedAt;
            }

            let playerData = await this.playerRepo.save(player)
            return playerData;
        } catch (error) {
            if (error instanceof Error) {
                throw error.message;
            } else {
                throw error;
            }
        }
    }

    async getAll(player: Player): Promise<Player[] | undefined> {
        try {
            let playerData: Player[] = [];

            if (!playerData || Object.keys(player).length === 0) {
                playerData = await this.playerRepo.find({
                    relations: ["game"],
                    where: [
                        { id: player.id },
                        { address: player.address },
                        { userId: player.userId }
                    ]
                })
            } else {
                playerData = await this.playerRepo.find({
                    where: [
                        { id: player.id },
                        { address: player.address },
                        { userId: player.userId },
                        { game: player.game },
                        { gameId: player.gameId },
                        { score: player.score },
                        { isWinner: player.isWinner },
                        { answers: player.answers },
                    ],
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

    async getById(id: string): Promise<Player | null> {
        try {
            if (!id) return null;

            let playerData: any = await this.playerRepo.find({
                relations: ["game"],
                where: [{ id: id }],
                take: 1,
            })

            return playerData && playerData.length > 0 ? playerData[0] : null;
        } catch (error) {
            if (error instanceof Error) {
                throw error.message;
            } else {
                throw error;
            }
        }
    }

    async deletePlayer(id: string, isHard?: boolean) {
        try {
            let playerData: any = await this.playerRepo.findOneBy({ id: id });
            playerData.id = id;
            playerData.delete = true;
            playerData.deleteDate = new Date();

            if (!playerData.id) return null;

            if (!isHard) {
                return await this.playerRepo.save(playerData);
            } else {
                return await this.playerRepo.delete({ id: id })
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