import { Repository } from "typeorm";
import { Question } from "../models/question.entity";
import AppDataSource from "../configs/ormconfig";
import dotenv from "dotenv"

export class QuestionRepository {
    private repo: Repository<Question>

    constructor() {
        this.repo = AppDataSource.getRepository(Question);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    /**
     * Save a Question
     * @param question Question
     * @returns Question
     */
    async saveQuestion(question: Question): Promise<Question | null> {
        try {
            if (!question.id) {
                question.quiz = question.quiz,
                    question.question = question.question,
                    question.answer = question.answer,
                    question.createdAt = new Date()
            }

            let questionData = await this.repo.save(question);
            return questionData;
        } catch (error) {
            throw error;
        }
    }
}