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
                    question.questionNumber = question.questionNumber,
                    question.answers = question.answers,
                    question.createdAt = new Date()
            }

            let questionData = await this.repo.save(question);
            return questionData;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get All Questions
     * @param question Question
     * @returns Question
     */
    async getAllQuestions(
        question?: Question,
        skip?: number,
        take?: number
    ): Promise<Question[]> {
        try {
            const hasFilter = question && (question.id || question.question || question.quiz);

            if (hasFilter) {
                return await this.repo.find({
                    where: [
                        { id: question.id },
                        { question: question.question },
                        { quiz: question.quiz }
                    ].filter(Boolean),
                    relations: ['answers', 'quiz'],
                    order: { createdAt: "DESC" },
                    skip: skip || 0,
                    take: take || 20
                });
            }

            return await this.repo.find({
                relations: ['answers', 'quiz'],
                order: { createdAt: "DESC" },
                skip: skip || 0,
                take: take || 20
            });
        } catch (error) {
           throw error 
        }
    }

    /**
     * Get a Question by Id
     * @param id Id
     * @returns Question
     */
    async getQuestionById(id: string): Promise<Question | null> {
        try {
            if(!id) return null;

            let questionData = await this.repo.find({
                where: [{ id:id }],
                take: 1
            })

            return questionData && questionData.length > 0 ? questionData[0] : null;
        } catch (error) {
            throw error
        }
    }
}