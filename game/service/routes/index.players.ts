import express from "express"
import PlayerController from "../controllers/player.controller";
import { authMiddleware, guestOrAuthMiddleware } from "../middleware/auth.middleware";


const router = express.Router();

// Player creation/listing requires a token (guest or wallet)
router.post("/", authMiddleware, PlayerController.players)
router.post("/createPlayer", guestOrAuthMiddleware, PlayerController.add)
router.get("/:id", PlayerController.player)
router.get("/leaderboard/:gameSessionId", PlayerController.leaderboard)
router.get("/stats/:gameSessionId/:playerName", PlayerController.playerStats)
router.get("/answers/:gameSessionId/:playerName", PlayerController.answerHistory)
router.get("/session/:gameSessionId", PlayerController.sessionPlayers)
router.get("/rank/:gameSessionId/:playerName", PlayerController.playerRank)

// Protected routes
router.post("/update-stats", authMiddleware, PlayerController.updateStats)
router.delete("/:gameSessionId/:playerName", authMiddleware, PlayerController.removePlayer)

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "application/json")
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME })
})

export default router;