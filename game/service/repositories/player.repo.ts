import { Repository } from "typeorm";
import dotenv from "dotenv"
import AppDataSource from "../configs/ormconfig";
import { Player } from "../models/player.entity";

export class PlayerRepository {
    private repo: Repository<Player>;

    constructor() {
        this.repo = AppDataSource.getRepository(Player);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    async getAllPlayers(filters?: any): Promise<Player[]> {
        try {
            return await this.repo.find({
                where: { deleted: false },
                relations: ['gameSession']
            });
        } catch (error) {
            throw error;
        }
    }

    async getPlayerById(id: string): Promise<Player | null> {
        try {
            return await this.repo.findOne({
                where: { id, deleted: false },
                relations: ['gameSession']
            });
        } catch (error) {
            throw error;
        }
    }

    async getPlayerByNameAndSession(gameSessionId: string, playerName: string): Promise<Player | null> {
        try {
            return await this.repo.findOne({
                where: {
                    gameSession: { id: gameSessionId },
                    playerName,
                    deleted: false
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async savePlayer(player: Player): Promise<Player> {
        try {
            return await this.repo.save(player);
        } catch (error) {
            throw error;
        }
    }

    async updatePlayerStats(data: {
        gameSessionId: string;
        playerName: string;
        totalScore?: number;
        correctAnswers?: number;
        wrongAnswers?: number;
        currentStreak?: number;
        bestStreak?: number;
    }): Promise<Player | null> {
        try {
            const player = await this.getPlayerByNameAndSession(data.gameSessionId, data.playerName);

            if (!player) return null;

            if (data.totalScore !== undefined) player.totalScore = data.totalScore;
            if (data.correctAnswers !== undefined) player.correctAnswers = data.correctAnswers;
            if (data.wrongAnswers !== undefined) player.wrongAnswers = data.wrongAnswers;
            if (data.currentStreak !== undefined) player.currentStreak = data.currentStreak;
            if (data.bestStreak !== undefined) {
                player.bestStreak = Math.max(player.bestStreak, data.bestStreak);
            }

            return await this.repo.save(player);
        } catch (error) {
            throw error;
        }
    }

    async getLeaderboard(gameSessionId: string): Promise<Player[]> {
        try {
            return await this.repo.find({
                where: {
                    gameSession: { id: gameSessionId },
                    deleted: false
                },
                order: {
                    totalScore: 'DESC',
                    bestStreak: 'DESC'
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async getPlayerStats(gameSessionId: string, playerName: string): Promise<Player | null> {
        try {
            return await this.repo.findOne({
                where: {
                    gameSession: { id: gameSessionId },
                    playerName,
                    deleted: false
                },
                relations: ['gameSession']
            });
        } catch (error) {
            throw error;
        }
    }

    async getSessionPlayers(gameSessionId: string): Promise<Player[]> {
        try {
            return await this.repo.find({
                where: {
                    gameSession: { id: gameSessionId },
                    deleted: false
                },
                order: { joinedAt: 'ASC' }
            });
        } catch (error) {
            throw error;
        }
    }

    async removePlayer(gameSessionId: string, playerName: string): Promise<boolean> {
        try {
            const player = await this.getPlayerByNameAndSession(gameSessionId, playerName);

            if (!player) return false;

            player.deleted = true;
            await this.repo.save(player);

            return true;
        } catch (error) {
            throw error;
        }
    }

    async getPlayerRank(gameSessionId: string, playerName: string): Promise<any> {
        try {
            const leaderboard = await this.getLeaderboard(gameSessionId);
            const playerIndex = leaderboard.findIndex(p => p.playerName === playerName);

            if (playerIndex === -1) return null;

            return {
                player: leaderboard[playerIndex],
                rank: playerIndex + 1,
                totalPlayers: leaderboard.length
            };
        } catch (error) {
            throw error;
        }
    }
}