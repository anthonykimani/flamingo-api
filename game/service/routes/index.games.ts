import express from "express"
import GameController from "../controllers/game.controller";

const router = express.Router();

// Game session management
router.post('/create-session', GameController.createSession);
router.post('/join', GameController.joinGame);
router.get('/session/:gameSessionId', GameController.getSession);
router.get('/gamepin/:gamePinId', GameController.getSessionByGamePin);
router.post('/start/:gameSessionId', GameController.startGame);
router.post('/updateGame/:gameSessionId', GameController.updateGame)
router.post('/end/:gameSessionId', GameController.endSession);
router.delete('/delete/:gameSessionId', GameController.deleteSession);

// Game play
router.post('/submit-answer', GameController.submitAnswer);
router.get('/leaderboard/:gameSessionId', GameController.getLeaderboard);
router.get('/players/:gameSessionId', GameController.getActivePlayers);

// Statistics
router.get('/player-stats/:gameSessionId/:playerName', GameController.getPlayerStats);
router.get('/question-stats/:gameSessionId/:questionId', GameController.getQuestionStats);
router.get('/session-summary/:gameSessionId', GameController.getSessionSummary);

router.get("*", function (req, res){
    res.setHeader("Content-Type", "applications/json")
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME})
})

export default router;