import express from "express"
import GameController from "../controllers/game.controller";
import { authMiddleware, guestOrAuthMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// Game session management (host-only, enforced in controller)
router.post('/create-session', authMiddleware, GameController.createSession);
router.post('/start/:gameSessionId', authMiddleware, GameController.startGame);
router.post('/updateGame/:gameSessionId', authMiddleware, GameController.updateGame)
router.post('/end/:gameSessionId', authMiddleware, GameController.endSession);
router.delete('/delete/:gameSessionId', authMiddleware, GameController.deleteSession);

// Game play — join is public but issues a guest token; submitting an
// answer requires that token (or a wallet token).
router.post('/join', GameController.joinGame);
router.get('/session/:gameSessionId', GameController.getSession);
router.get('/gamepin/:gamePinId', GameController.getGameSessionByGamePin);
router.get('/active', GameController.getActiveGames);
router.post('/submit-answer', guestOrAuthMiddleware, GameController.submitAnswer);
router.get('/leaderboard/:gameSessionId', GameController.getLeaderboard);
router.get('/players/:gameSessionId', GameController.getActivePlayers);

// Statistics (public)
router.get('/player-stats/:gameSessionId/:playerName', GameController.getPlayerStats);
router.get('/question-stats/:gameSessionId/:questionId', GameController.getQuestionStats);
router.get('/session-summary/:gameSessionId', GameController.getSessionSummary);

router.get("*", function (req, res){
    res.setHeader("Content-Type", "application/json")
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME})
})

export default router;