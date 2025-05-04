import { Repository } from "typeorm";
import AppDataSource from "../configs/ormconfig";
import { Quiz } from "../models/quiz.entity";

export class QuizRepository {
    private quizRepo: Repository<Quiz>

    constructor() {
        this.quizRepo = AppDataSource.getRepository(Quiz)
    }

    /**
   * Save a new quiz with questions and answers
   * @param quiz IQuiz
   * @returns Quiz
   */
    async createQuiz(quiz: Quiz): Promise<Quiz | undefined> {
        try {
            if (!quiz.id) {
                quiz.title = quiz.title;
                quiz.description = quiz.description;
                quiz.isPublished = quiz.isPublished;
                quiz.createdAt = new Date();
                quiz.updatedAt = new Date();
            }

            let quizData = await this.quizRepo.save(quiz);

            return quizData;
        } catch (error) {
            if (error instanceof Error) {
                throw error.message;
            } else {
                throw error;
            }
        }
    }

    /**
     * Get all Quiz
     * @param quiz Quiz filter params
     * @returns Promise<Quiz[]>
     */
    async getAll(quiz?: Quiz, skip?: number, take?: number) {
        try {
            let quizData: Quiz[] = [];

            if (!quiz || Object.keys(quiz).length === 0) {
                quizData = await this.quizRepo.find({
                    relations: ["questions", "questions.answers"],
                    order: { createdAt: "DESC" }
                });

            } else {
                quizData = await this.quizRepo.find({
                    relations: ["questions", "questions.answers"],
                    where: [
                        { id: quiz.id },
                        { title: quiz.title },
                        { description: quiz.description },
                        { isPublished: quiz.isPublished }
                    ]
                })
            }

            return quizData;
        } catch (error) {
            if (error instanceof Error) {
                throw error.message;
            } else {
                throw error;
            }
        }
    }

    /**
     * Get Quiz by Id
     * @param id Quiz id
     * @returns Promise<Quiz>
     */
    async getById(id: string): Promise<Quiz | null> {
        try {
            if (!id) return null;

            let quizData: any = await this.quizRepo.find({
                relations: ["questions", "questions.answers"],
                where: [{ id: id }],
                take: 1,
            });

            return quizData && quizData.length > 0 ? quizData[0] : null;
        } catch (error) {
            if (error instanceof Error) {
                throw error.message;
            } else {
                throw error;
            }
        }
    }

    /**
     * Delete a review
     * @param id Review id
     * @returns boolean
     */
    async deleteQuiz(id: string, isHard?: boolean) {
        try {
            // if (!id) return null;

            // let quizData = await this.quizRepo.delete(id);

            // return quizData

            let quizData: any = await this.quizRepo.findOneBy({ id:id });
            quizData.id = id;
            quizData.delete = true;
            quizData.deleteDate = new Date();

            if(!quizData.id) return null;

            if(!isHard) {
                return await this.quizRepo.save(quizData);
            } else {
                return await this.quizRepo.delete({ id:id })
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