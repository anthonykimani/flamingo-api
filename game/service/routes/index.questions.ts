import express from "express";
import QuestionController from "../controllers/question.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/", authMiddleware, QuestionController.questions);
router.post("/createQuestion", authMiddleware, QuestionController.add)

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "application/json")
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME })
})

export default router;