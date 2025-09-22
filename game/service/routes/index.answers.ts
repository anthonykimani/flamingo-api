import express from "express"
import AnswerController from "../controllers/answer.controller";

const router = express.Router();

router.post("/", AnswerController.answers);
router.post("/addAnswer", AnswerController.add)

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "applications/json")
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME })
})

export default router;