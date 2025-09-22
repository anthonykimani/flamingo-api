import { Question } from "../models/question.entity";
import { Quiz } from "../models/quiz.entity";
import { QuestionRepository } from "../repositories/question.repo";
import { QuizRepository } from "../repositories/quiz.repo";
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
            const quizRepo: QuizRepository = new QuizRepository();

            const {
                quizId,
                question,
                answers,
            } = req.body

            if(!question) {
                return res.send(super.response(super._400, null, ["Question Text is required"]));
            }

            if(!quizId) {
                return res.send(super.response(super._404, null, ["QuizId is required"]));
            }

            const quizEntity: Quiz | null = await quizRepo.getQuizById(quizId);

            if (!quizEntity) {
                return res.send(super.response(super._404, null, ["Quiz not Found"]));
            }

            let questionInstance = new Question();
            
                questionInstance.quiz = quizEntity;
                questionInstance.question = question;
                questionInstance.answers = answers

            let questionData = await repo.saveQuestion(questionInstance);

            return res.send(super.response(super._200, questionData));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }
}

export default QuestionController;