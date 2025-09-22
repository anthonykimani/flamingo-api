import { Repository } from "typeorm";
import { Answer } from "../models/answer.entity";
import AppDataSource from "../configs/ormconfig";
import dotenv from "dotenv"


export class AnswerRepository {
    private repo: Repository<Answer>

    constructor() {
        this.repo = AppDataSource.getRepository(Answer);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}`});
    }

    /**
     * Save Answer
     * @param answer AnswerData
     * @returns Answer
     */
    async saveAnswer (answer: Answer): Promise<Answer | null> {
        try {
            if(!answer.id){
                answer.answer = answer.answer,
                answer.correctAnswer = answer.correctAnswer,
                answer.question = answer.question
            }

            let answerData = await this.repo.save(answer);
            return answerData
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all answers
     * @param answer Answer
     * @returns Answer
     */
    async getAllAnswers(
        answer?: Answer,
        skip?: number,
        take?: number,
    ) {
        try {
            let answerData: Answer[] = [];

            if(!answerData || Object.keys(answerData).length === 0) {
                answerData = await this.repo.find({
                    where: {
                        deleted: false
                    },
                    relations: ['question']
                })
            }

            return answerData;
        } catch (error) {
            throw error
        }
    }

    /**
     * Get Answer by Id
     * @param id Id
     * @returns Answer
     */
    async getAnswerById(id: string): Promise<Answer | null> {
        try {
            if (!id) return null;

            let answerData = await this.repo.find({
                where: [{ id:id }],
                take: 1
            })

            return answerData && answerData.length > 0 ? answerData[0] : null;
        } catch (error) {
            throw error;
        }
    }

}