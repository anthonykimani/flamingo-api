import express from "express"
import QuizController from "../controllers/quiz.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/", authMiddleware, QuizController.quizzes);
router.post("/createQuiz", authMiddleware, QuizController.add);
router.post("/createAgentQuiz", authMiddleware, QuizController.addAgentQuiz);
router.get("/quiz/:id", authMiddleware, QuizController.quiz);

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "application/json")
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME })
})

export default router