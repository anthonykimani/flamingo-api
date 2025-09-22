import AppDataSource from "../configs/ormconfig";
import { Answer } from "../models/answer.entity";
import { Question } from "../models/question.entity";
import { AnswerRepository } from "../repositories/answers.repo";
import Controller from "./controller";
import { Request, Response } from "express";

class AnswerController extends Controller {
    /**
     * Get Answer List
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async answers(req: Request, res: Response) {
        try {
            const repo: AnswerRepository = new AnswerRepository();
            let answerData = await repo.getAllAnswers(req.body);

            if (answerData) {
                return res.send(super.response(super._200, answerData));
            } else {
                return res.send(super.response(super._404, answerData, [super._404.message]));
            }
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get Answer by Id
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async answer(req: Request, res: Response) {
        try {
            const repo: AnswerRepository = new AnswerRepository();
            let { id } = req.body;

            let answerData = await repo.getAnswerById(id);

            if (answerData) {
                return res.send(super.response(super._200, answerData));
            } else {
                return res.send(super.response(super._404, answerData, [super._404.message]));
            }
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Add Answer
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async add(req: Request, res: Response) {
        try {
            const repo: AnswerRepository = new AnswerRepository();
            const questionRepo = AppDataSource.getRepository(Question);

            const {
                questionId,
                answer,
                correctAnswer
            } = req.body;

            const question = await questionRepo.findOneBy({ id: questionId });

            if (!question) {
                return res.send(super.response(super._404, null, ["Question not found"]));
            }

            let answerEntity = new Answer();
            answerEntity.question = question;
            answerEntity.answer = answer;
            answerEntity.correctAnswer = correctAnswer;

            let answerData = await repo.saveAnswer(answerEntity);

            return res.send(super.response(super._200, answerData));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Update Answer
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async update(req: Request, res: Response) {
        try {
            const repo: AnswerRepository = new AnswerRepository();
            const questionRepo = AppDataSource.getRepository(Question);

            const {
                id,
                questionId,
                answer,
                correctAnswer
            } = req.body;

            let existingAnswer = await repo.getAnswerById(id);

            if (!existingAnswer) {
                return res.send(super.response(super._404, null, ["Answer not found"]));
            }

            if (questionId) {
                const question = await questionRepo.findOneBy({ id: questionId });
                if (!question) {
                    return res.send(super.response(super._404, null, ["Question not found"]));
                }
                existingAnswer.question = question;
            }

            if (answer !== undefined) {
                existingAnswer.answer = answer;
            }

            if (correctAnswer !== undefined) {
                existingAnswer.correctAnswer = correctAnswer;
            }

            let answerData = await repo.saveAnswer(existingAnswer);

            return res.send(super.response(super._200, answerData));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }
}

export default AnswerController;