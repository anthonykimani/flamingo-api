import { GameState } from "../../enums/GameState";
import { GameMode } from "../../enums/GameMode";
import sinon from "sinon";

export const mockGame = {
  id: "test-game-uuid",
  gamePin: "123456",
  gameTitle: "Test Quiz",
  gameMode: GameMode.HANGOUTS,
  status: GameState.WAITING,
  isActive: true,
  currentQuestionIndex: 0,
  timeLeft: 10,
  questionDuration: 10,
  hasPrizes: false,
  prizePool: "0",
  minPlayers: 1,
  maxPlayers: 50,
  quiz: {
    id: "quiz-uuid",
    title: "Test Quiz",
    questions: [
      {
        id: "q1",
        question: "What is 2+2?",
        questionNumber: 1,
        answers: [
          { id: "a1", answer: "3", correctAnswer: false },
          { id: "a2", answer: "4", correctAnswer: true },
          { id: "a3", answer: "5", correctAnswer: false },
          { id: "a4", answer: "6", correctAnswer: false },
        ],
      },
      {
        id: "q2",
        question: "What is the capital of France?",
        questionNumber: 2,
        answers: [
          { id: "b1", answer: "London", correctAnswer: false },
          { id: "b2", answer: "Paris", correctAnswer: true },
          { id: "b3", answer: "Berlin", correctAnswer: false },
          { id: "b4", answer: "Madrid", correctAnswer: false },
        ],
      },
      {
        id: "q3",
        question: "What color is the sky?",
        questionNumber: 3,
        answers: [
          { id: "c1", answer: "Red", correctAnswer: false },
          { id: "c2", answer: "Blue", correctAnswer: true },
          { id: "c3", answer: "Green", correctAnswer: false },
          { id: "c4", answer: "Yellow", correctAnswer: false },
        ],
      },
    ],
  },
  players: [],
  playerAnswers: [],
  deleted: false,
};

export const mockPlayer = {
  id: "player-uuid",
  playerName: "TestPlayer",
  walletAddress: "0x1234567890123456789012345678901234567890",
  totalScore: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  hasAnsweredCurrent: false,
  hasDeposited: false,
  deleted: false,
};

export const mockPlayers = [
  { ...mockPlayer, id: "p1", playerName: "Alice", walletAddress: "0x1111" },
  { ...mockPlayer, id: "p2", playerName: "Bob", walletAddress: "0x2222" },
  { ...mockPlayer, id: "p3", playerName: "Charlie", walletAddress: "0x3333" },
];

export function createMockGameRepository() {
  return {
    getSessionById: sinon.stub(),
    getSessionWithDetails: sinon.stub(),
    getSessionByPin: sinon.stub(),
    getActiveSessions: sinon.stub(),
    createSession: sinon.stub(),
    updateGameState: sinon.stub(),
    updateCurrentQuestion: sinon.stub(),
    startSession: sinon.stub(),
    endSession: sinon.stub(),
    updateSession: sinon.stub(),
    resetSession: sinon.stub(),
    deleteSession: sinon.stub(),
    markGameLocked: sinon.stub(),
    markPrizesDistributed: sinon.stub(),
    isGameLocked: sinon.stub(),
    isPaidOut: sinon.stub(),
    saveSession: sinon.stub(),
    updateBlockchainInfo: sinon.stub(),
    getBlockchainInfo: sinon.stub(),
    getLockedUnpaidGames: sinon.stub(),
    isPinUnique: sinon.stub(),
    generateUniqueGamePin: sinon.stub(),
    getSessionSummary: sinon.stub(),
    getGameTiming: sinon.stub(),
    isAcceptingAnswers: sinon.stub(),
    getCurrentQuestion: sinon.stub(),
    getSessionWithDetailsOrFail: sinon.stub(),
    updateQuestionTiming: sinon.stub(),
    setQuestionDuration: sinon.stub(),
  };
}

export function createMockPlayerRepository() {
  return {
    getAllPlayers: sinon.stub(),
    getPlayerById: sinon.stub(),
    getPlayerByNameAndSession: sinon.stub(),
    savePlayer: sinon.stub(),
    updatePlayerStats: sinon.stub(),
    getLeaderboard: sinon.stub(),
    getPlayerStats: sinon.stub(),
    getSessionPlayers: sinon.stub(),
    removePlayer: sinon.stub(),
    getPlayerRank: sinon.stub(),
    resetAnsweredStatus: sinon.stub(),
  };
}

export function createMockPlayerAnswerRepository() {
  return {
    saveAnswer: sinon.stub(),
    getPlayerQuestionAnswer: sinon.stub(),
    getQuestionAnswers: sinon.stub(),
    getGameAnswers: sinon.stub(),
  };
}

export function createMockFlamingoEscrowService() {
  return {
    createGameSession: sinon.stub(),
    distributePrizes: sinon.stub(),
  };
}
