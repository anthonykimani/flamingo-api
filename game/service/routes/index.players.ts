import express from "express"
import PlayerController from "../controllers/player.controller";


const router = express.Router();

router.post("/", PlayerController.players)
router.post("/createPlayer", PlayerController.add)

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "applications/json")
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME })
})

export default router;