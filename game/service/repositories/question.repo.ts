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

    /**
     * Get All Questions
     * @param question Question
     * @returns Question
     */
    async getAllQuestions(
        question?: Question,
        skip?: number,
        take?: number
    ) {
        try {
            let questionData: Question[] = [];

            if(!questionData || Object.keys(questionData).length === 0) {
                questionData = await this.repo.find({
                    where: [
                        { id: question?.id },
                        { quiz: question?.quiz },
                        { question: question?.question }
                    ],
                    order: {
                        createdAt: "DESC"
                    }
                })
            }

            return questionData;
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