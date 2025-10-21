import express from "express"
import QuizController from "../controllers/quiz.controller";

const router = express.Router();

router.post("/", QuizController.quizzes);
router.post("/createQuiz", QuizController.add);
router.post("/createAgentQuiz", QuizController.addAgentQuiz);
router.get("/quiz/:id", QuizController.quiz);

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "applications/json")
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME })
})

export default router