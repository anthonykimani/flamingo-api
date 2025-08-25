import express from "express"
import GameController from "../controllers/game.controller";

const router = express.Router();

router.post("/", GameController.games);
router.post("/addGame", GameController.add)

router.get("*", function (req, res){
    res.setHeader("Content-Type", "applications/json")
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME})
})

export default router;