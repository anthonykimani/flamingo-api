import { Question } from "../models/question.entity";
import { QuestionRepository } from "../repositories/question.repo";
import Controller from "./controller";
import { Request, Response } from "express";


class QuestionController extends Controller {
    /**
     * Get Question List
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async questions(req: Request, res: Response) {
        try {
            const repo: QuestionRepository = new QuestionRepository();
            let questionData = await repo.getAllQuestions(req.body);

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
     * Get Question by Id
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async question(req: Request, res: Response) {
        try {
            const repo: QuestionRepository = new QuestionRepository();
            let { id } = req.body;

            let questionData = await repo.getQuestionById(id);

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
     * Add Question
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async add(req: Request, res: Response) {
        try {
            const repo: QuestionRepository = new QuestionRepository();

            const {
                quiz,
                question,
                answer,
            } = req.body

            let questionInstance = new Question();
            
                questionInstance.quiz = quiz,
                questionInstance.question = question,
                questionInstance.answer = answer

            let questionData = await repo.saveQuestion(questionInstance);

            return res.send(super.response(super._200, questionData));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }
}

export default QuestionController;