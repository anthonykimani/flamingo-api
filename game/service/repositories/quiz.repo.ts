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

}