import { Quiz } from "../models/quiz.entity";
import { QuizRepository } from "../repositories/quiz.repo";
import Controller from "./controller";
import { Request, Response } from "express";


class QuizController extends Controller {
    /**
     * Get Quiz List
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async quizzes(req: Request, res: Response) {
        try {
            const repo: QuizRepository = new QuizRepository();
            let questionData = await repo.getAllQuizzes(req.body);

            if (questionData) {
                return res.send(super.response(super._200, questionData))
            } else {
                return res.send(super.response(super._404, questionData, [super._404.message]))
            }

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)))
        }
    }

    /**
     * Get Quiz by Id
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async quiz(req: Request, res: Response) {
        try {
            const repo: QuizRepository = new QuizRepository();
            let { id } = req.body;

            let questionData = await repo.getQuizById(id);

            if (questionData) {
                return res.send(super.response(super._200, questionData))
            } else {
                return res.send(super.response(super._404, questionData, [super._404.message]))
            }

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)))
        }
    }


    /**
     * Add Quiz
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async add(req: Request, res: Response) {
        try {
            const repo: QuizRepository = new QuizRepository();

            const {
                title,
                description
            } = req.body

            let questionInstance = new Quiz();
            
                questionInstance.title = title,
                questionInstance.description = description

            let questionData = await repo.saveQuiz(questionInstance);

            return res.send(super.response(super._200, questionData));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }
}

export default QuizController;