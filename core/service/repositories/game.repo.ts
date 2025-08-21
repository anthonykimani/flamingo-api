// src/repositories/game.repo.ts
import { Repository } from "typeorm";
import AppDataSource from "../configs/ormconfig";
import { Game } from "../models/game.entity";

export class GameRepository {
  private gameRepo: Repository<Game>;

  constructor() {
    this.gameRepo = AppDataSource.getRepository(Game);
  }

  /**
   * Create or update a Game
   * @param game Game object
   * @returns Saved Game
   */
  async createGame(game: Game): Promise<Game | undefined> {
    try {
      if (!game.id) {
        game.created = new Date();
        game.createdAt = new Date();
        game.updatedAt = new Date();
      }

      const gameData = await this.gameRepo.save(game);
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
   * Get all games (with optional filters)
   * @param game Filter object
   * @returns Game[]
   */
  async getAll(game?: Game): Promise<Game[] | undefined> {
    try {
      let gameData: Game[] = [];

      if (!game || Object.keys(game).length === 0) {
        gameData = await this.gameRepo.find({
          relations: ["players"],
          order: { createdAt: "DESC" },
        });
      } else {
        gameData = await this.gameRepo.find({
          relations: ["players"],
          where: [
            { id: game.id },
            { quizId: game.quizId },
            { address: game.address },
            { gameTitle: game.gameTitle },
            { entryFee: game.entryFee },
            { maxPlayers: game.maxPlayers },
            { status: game.status },
          ],
        });
      }

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
   * Get a game by ID
   * @param id Game ID
   * @returns Game | null
   */
  async getById(id: string): Promise<Game | null> {
    try {
      if (!id) return null;

      const gameData = await this.gameRepo.find({
        relations: ["players"],
        where: [{ id }],
        take: 1,
      });

      return gameData && gameData.length > 0 ? gameData[0] : null;
    } catch (error) {
      if (error instanceof Error) {
        throw error.message;
      } else {
        throw error;
      }
    }
  }

  /**
   * Delete (soft or hard) a game
   * @param id Game ID
   * @param isHard Permanently delete if true
   * @returns Result
   */
  async deleteGame(id: string, isHard?: boolean) {
    try {
      const gameData = await this.gameRepo.findOneBy({ id });

      if (!gameData?.id) return null;

      if (!isHard) {
        // For soft delete, just mark status and timestamp
        gameData.status = "completed"; // or add custom 'deleted' status
        gameData.updatedAt = new Date();
        return await this.gameRepo.save(gameData);
      } else {
        return await this.gameRepo.delete({ id });
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
