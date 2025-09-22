import express from "express";
import QuestionController from "../controllers/question.controller";

const router = express.Router();

router.post("/", QuestionController.questions);
router.post("/createQuestion", QuestionController.add)

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "applications/json")
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME })
})

export default router;