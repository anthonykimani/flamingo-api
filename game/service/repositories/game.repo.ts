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
            session.currentQuestionIndex = 0;
            session.startedAt = new Date();
            session.timeLeft = session.timeLeft;
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

    /**
     * Get session with full relations (quiz, questions, answers, players)
     */
    async getSessionWithDetails(id: string): Promise<Game | null> {
        try {
            return await this.repo.findOne({
                where: { id, deleted: false },
                relations: [
                    'quiz',
                    'quiz.questions',
                    'quiz.questions.answers',
                    'players',
                    'playerAnswers'
                ]
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update game state
     */
    async updateGameState(id: string, state: GameState): Promise<Game | null> {
        try {
            const session = await this.repo.findOne({ where: { id } });
            if (!session) return null;

            session.status = state;
            session.updatedAt = new Date();

            if (state === GameState.IN_PROGRESS && !session.startedAt) {
                session.startedAt = new Date();
            }

            if (state === GameState.COMPLETED) {
                session.endedAt = new Date();
                session.isActive = false;
            }

            return await this.repo.save(session);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get active sessions
     */
    async getActiveSessions(): Promise<Game[]> {
        try {
            return await this.repo.find({
                where: { isActive: true, deleted: false },
                relations: ['quiz'],
                order: { startedAt: 'DESC' }
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if game pin is unique
     */
    async isPinUnique(gamePin: string): Promise<boolean> {
        try {
            const existing = await this.repo.findOne({
                where: { gamePin, deleted: false }
            });
            return !existing;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate unique game pin
     */
    async generateUniqueGamePin(): Promise<string> {
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const pin = this.generateGamePin();
            const isUnique = await this.isPinUnique(pin);
            
            if (isUnique) {
                return pin;
            }
            
            attempts++;
        }

        throw new Error('Failed to generate unique game pin');
    }

    /**
     * Get session summary statistics
     */
    async getSessionSummary(id: string): Promise<any> {
        try {
            const session = await this.repo.findOne({
                where: { id, deleted: false },
                relations: ['quiz', 'players', 'playerAnswers']
            });

            if (!session) return null;

            const totalPlayers = session.players?.length || 0;
            const totalQuestions = session.quiz?.questions?.length || 0;
            const totalAnswers = session.playerAnswers?.length || 0;
            const correctAnswers = session.playerAnswers?.filter(a => a.isCorrect).length || 0;
            const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

            return {
                gameId: session.id,
                gamePin: session.gamePin,
                quizTitle: session.quiz?.title,
                totalPlayers,
                totalQuestions,
                totalAnswers,
                correctAnswers,
                accuracy: Math.round(accuracy * 100) / 100,
                duration: session.endedAt && session.startedAt 
                    ? Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
                    : null,
                startedAt: session.startedAt,
                endedAt: session.endedAt
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update current question index
     */
    async updateCurrentQuestion(id: string, questionIndex: number): Promise<Game | null> {
        try {
            const session = await this.repo.findOne({ where: { id } });
            if (!session) return null;

            // You might need to add a currentQuestionIndex field to your Game entity
            // session.currentQuestionIndex = questionIndex;
            session.updatedAt = new Date();

            return await this.repo.save(session);
        } catch (error) {
            throw error;
        }
    }
}