import express from "express"
import AnswerController from "../controllers/answer.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/", authMiddleware, AnswerController.answers);
router.post("/addAnswer", authMiddleware, AnswerController.add)

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "application/json")
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME })
})

export default router;