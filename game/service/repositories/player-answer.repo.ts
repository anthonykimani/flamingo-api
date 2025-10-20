import { Repository } from "typeorm";
import AppDataSource from "../configs/ormconfig";
import { PlayerAnswer } from "../models/player-answer.entity";
import dotenv from "dotenv"


export class PlayerAnswerRepository {
    private repo: Repository<PlayerAnswer>;

    constructor() {
        this.repo = AppDataSource.getRepository(PlayerAnswer);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    async saveAnswer(answerData: Partial<PlayerAnswer>): Promise<PlayerAnswer> {
        try {
            const answer = this.repo.create(answerData);
            return await this.repo.save(answer);
        } catch (error) {
            throw error;
        }
    }

    async getPlayerAnswers(gameSessionId: string, playerName: string): Promise<PlayerAnswer[]> {
        try {
            return await this.repo.find({
                where: {
                    gameSession: { id: gameSessionId },
                    playerName,
                    deleted: false
                },
                relations: ['question', 'selectedAnswer'],
                order: { answeredAt: 'ASC' }
            });
        } catch (error) {
            throw error;
        }
    }

    async getSessionAnswers(gameSessionId: string): Promise<PlayerAnswer[]> {
        try {
            return await this.repo.find({
                where: {
                    gameSession: { id: gameSessionId },
                    deleted: false
                },
                relations: ['question', 'selectedAnswer'],
                order: { answeredAt: 'ASC' }
            });
        } catch (error) {
            throw error;
        }
    }

    async getPlayerAnswerForQuestion(
        gameSessionId: string,
        playerName: string,
        questionId: string
    ): Promise<PlayerAnswer | null> {
        try {
            return await this.repo.findOne({
                where: {
                    gameSession: { id: gameSessionId },
                    playerName,
                    question: { id: questionId },
                    deleted: false
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async getQuestionAnswers(gameSessionId: string, questionId: string): Promise<PlayerAnswer[]> {
        try {
            return await this.repo.find({
                where: {
                    gameSession: { id: gameSessionId },
                    question: { id: questionId },
                    deleted: false
                },
                relations: ['selectedAnswer', 'question']
            });
        } catch (error) {
            throw error;
        }
    }
}