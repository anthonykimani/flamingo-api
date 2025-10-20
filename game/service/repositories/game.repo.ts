import AppDataSource from "../configs/ormconfig";
import { GameState } from "../enums/GameState";
import { Game } from "../models/game.entity";

export class GameRepository {
    private repo = AppDataSource.getRepository(Game);

    async createSession(quizId: string): Promise<Game> {
        try {
            const gamePin = this.generateGamePin();

            const session = this.repo.create({
                gamePin,
                quiz: { id: quizId } as any,
                isActive: true,
                startedAt: new Date()
            });

            return await this.repo.save(session);
        } catch (error) {
            throw error;
        }
    }

    async getSessionByPin(gamePin: string): Promise<Game | null> {
        try {
            return await this.repo.findOne({
                where: { gamePin, deleted: false },
                relations: ['quiz']
            });
        } catch (error) {
            throw error;
        }
    }

    async getSessionById(id: string): Promise<Game | null> {
        try {
            return await this.repo.findOne({
                where: { id, deleted: false },
                relations: ['quiz', 'playerAnswers']
            });
        } catch (error) {
            throw error;
        }
    }

    async endSession(id: string): Promise<Game | null> {
        try {
            const session = await this.repo.findOne({ where: { id } });
            if (!session) return null;

            session.isActive = false;
            session.endedAt = new Date();

            return await this.repo.save(session);
        } catch (error) {
            throw error;
        }
    }

    private generateGamePin(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async startSession(id: string): Promise<Game | null> {
        try {
            const session = await this.repo.findOne({ where: { id } });
            if (!session) return null;

            session.isActive = true;
            session.startedAt = new Date();
            session.status = GameState.IN_PROGRESS

            return await this.repo.save(session);
        } catch (error) {
            throw error;
        }
    }

    async updateSession(id:string, gameState: GameState): Promise<Game | null> {
        try {
            const session = await this.repo.findOne({ where: { id }});
            if(!session) return null;
            session.updatedAt = new Date();
            session.status = gameState

            return await this.repo.save(session)
        } catch (error) {
            throw error;
        }
    }

    async deleteSession(id: string): Promise<boolean> {
        try {
            const session = await this.repo.findOne({ where: { id } });
            if (!session) return false;

            session.deleted = true;
            await this.repo.save(session);

            return true;
        } catch (error) {
            throw error;
        }
    }
}