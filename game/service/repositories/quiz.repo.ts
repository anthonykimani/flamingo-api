import { Repository } from "typeorm";
import { Quiz } from "../models/quiz.entity";
import AppDataSource from "../configs/ormconfig";
import dotenv from "dotenv"


export class QuizRepository {
    private repo: Repository<Quiz>

    constructor() {
        this.repo = AppDataSource.getRepository(Quiz);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    /**
     * Save Quiz
     * @param quiz QuizData
     * @returns Quiz
     */
    async saveQuiz (quiz: Quiz): Promise<Quiz | null> {
        try {
            if(!quiz.id) {
                quiz.title = quiz.title,
                quiz.description = quiz.description,
                quiz.isPublished = true,
                quiz.questions = quiz.questions,
                quiz.games = quiz.games
            }
            
            let quizData = await this.saveQuiz(quiz);
            return quizData
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all quizzes
     * @param quiz Quiz
     * @returns Quiz
     */
    async getAllQuizzes(
        quiz?: Quiz,
        skip?: number,
        take?: number
    ) {
        try {
            let quizData: Quiz[] = [];

            if(!quizData || Object.keys(quizData).length === 0) {
                quizData = await this.repo.find({
                    where: {
                        isPublished: true
                    }
                })
            } else {
                quizData = await this.repo.find({
                    where: [
                        { id: quiz?.id },
                        { title: quiz?.title },
                        { description: quiz?.description },
                        { isPublished: quiz?.isPublished }
                    ],
                    order: {
                        createdAt: "DESC"
                    }
                })
            }
        } catch (error) {
            throw error
        }
    }

    /**
     * Get Quiz by id
     * @param id Id
     * @returns Quiz
     */
    async getQuizById(id: string): Promise<Quiz | null> {
        try {
            if (!id) return null;

            let quizData = await this.repo.find({
                where: [{ id:id }],
                take: 1
            })

            return quizData && quizData.length > 0 ? quizData[0] : null;
        } catch (error) {
            throw error;
        }
    }

}