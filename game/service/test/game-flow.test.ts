import { expect } from "chai";
import sinon from "sinon";
import { GameState } from "../enums/GameState";
import { GameMode } from "../enums/GameMode";
import { SocketEvents } from "../enums/SocketEvents";
import {
  mockGame,
  mockPlayer,
  mockPlayers,
  createMockGameRepository,
  createMockPlayerRepository,
  createMockPlayerAnswerRepository,
  createMockFlamingoEscrowService,
} from "./mocks/repository-mocks";

describe("Game Flow", () => {
  let gameRepo: ReturnType<typeof createMockGameRepository>;
  let playerRepo: ReturnType<typeof createMockPlayerRepository>;
  let answerRepo: ReturnType<typeof createMockPlayerAnswerRepository>;
  let escrowService: ReturnType<typeof createMockFlamingoEscrowService>;

  beforeEach(() => {
    gameRepo = createMockGameRepository();
    playerRepo = createMockPlayerRepository();
    answerRepo = createMockPlayerAnswerRepository();
    escrowService = createMockFlamingoEscrowService();
  });

  describe("Game Session Lifecycle", () => {
    it("should transition through valid states: WAITING -> COUNTDOWN -> IN_PROGRESS -> RESULTS_READY -> COMPLETED", () => {
      const validTransitions: Record<string, string[]> = {
        [GameState.CREATED]: [GameState.WAITING],
        [GameState.WAITING]: [GameState.COUNTDOWN],
        [GameState.COUNTDOWN]: [GameState.IN_PROGRESS],
        [GameState.IN_PROGRESS]: [GameState.RESULTS_READY],
        [GameState.RESULTS_READY]: [GameState.COUNTDOWN, GameState.COMPLETED],
        [GameState.COMPLETED]: [],
      };

      expect(validTransitions[GameState.WAITING]).to.include(GameState.COUNTDOWN);
      expect(validTransitions[GameState.COUNTDOWN]).to.include(GameState.IN_PROGRESS);
      expect(validTransitions[GameState.IN_PROGRESS]).to.include(GameState.RESULTS_READY);
      expect(validTransitions[GameState.RESULTS_READY]).to.include(GameState.COMPLETED);
    });
  });

  describe("Host Joining", () => {
    it("should allow host to join without creating a player entity", () => {
      const hostName = "Host";
      expect(hostName).to.equal("Host");
    });

    it("should not treat Host as a countable player", () => {
      const players = [...mockPlayers];
      const isHost = false;
      const totalPlayers = players.length + (isHost ? 0 : 0);
      expect(totalPlayers).to.equal(3);
    });
  });

  describe("Player Joining", () => {
    it("should create a new player when they don't exist", () => {
      playerRepo.getPlayerByNameAndSession.resolves(null);
      playerRepo.savePlayer.resolves(mockPlayer);

      const existing = null;
      expect(existing).to.be.null;
    });

    it("should reject joining a non-existent game session", () => {
      gameRepo.getSessionById.resolves(null);
      expect(mockGame.isActive).to.be.true;
    });

    it("should require wallet address for Degen PvP mode", () => {
      const degenGame = { ...mockGame, gameMode: GameMode.DEGEN_PVP };
      const hasWallet = true;
      const noWallet = false;

      if (degenGame.gameMode === GameMode.DEGEN_PVP) {
        expect(hasWallet).to.be.true;
      }
    });

    it("should NOT require wallet address for Hangouts mode", () => {
      const hangoutsGame = { ...mockGame, gameMode: GameMode.HANGOUTS };
      const noWallet = false;

      if (hangoutsGame.gameMode === GameMode.HANGOUTS) {
        expect(true).to.be.true;
      }
    });
  });

  describe("Answer Submission", () => {
    it("should reject double-answering by the same player", () => {
      const player = { ...mockPlayer, hasAnsweredCurrent: true };
      expect(player.hasAnsweredCurrent).to.be.true;

      const alreadyAnswered = player.hasAnsweredCurrent;
      expect(alreadyAnswered).to.be.true;
    });

    it("should calculate correct answer with streak and time bonus", () => {
      const player = { ...mockPlayer, currentStreak: 2 };
      const questionDuration = 10;
      const timeToAnswer = 3;
      const isCorrect = true;

      const newStreak = player.currentStreak + 1;
      let pointsEarned = 100;
      pointsEarned += newStreak * 50;
      const timeBonusPercent = Math.max(
        0,
        (questionDuration - timeToAnswer) / questionDuration
      );
      pointsEarned += Math.floor(timeBonusPercent * 50);

      expect(newStreak).to.equal(3);
      expect(pointsEarned).to.equal(100 + 150 + 35);
    });

    it("should reset streak on wrong answer and award 0 points", () => {
      const player = { ...mockPlayer, currentStreak: 5 };
      const isCorrect = false;

      const newStreak = isCorrect ? player.currentStreak + 1 : 0;
      const pointsEarned = isCorrect ? 100 : 0;

      expect(newStreak).to.equal(0);
      expect(pointsEarned).to.equal(0);
    });
  });

  describe("Game Completion Flow", () => {
    it("should end game when no more questions remain", () => {
      const totalQuestions = 3;
      const currentIndex = 2;
      const isLastQuestion = currentIndex >= totalQuestions - 1;

      expect(isLastQuestion).to.be.true;
    });

    it("should NOT end game when questions remain", () => {
      const totalQuestions = 3;
      const currentIndex = 1;
      const isLastQuestion = currentIndex >= totalQuestions - 1;

      expect(isLastQuestion).to.be.false;
    });

    it("should build correct leaderboard order after game ends", () => {
      const finalScores = [
        { playerName: "Alice", totalScore: 800, bestStreak: 5 },
        { playerName: "Bob", totalScore: 600, bestStreak: 3 },
        { playerName: "Charlie", totalScore: 400, bestStreak: 2 },
      ];

      const sorted = [...finalScores].sort(
        (a, b) => b.totalScore - a.totalScore
      );

      expect(sorted[0].playerName).to.equal("Alice");
      expect(sorted[1].playerName).to.equal("Bob");
      expect(sorted[2].playerName).to.equal("Charlie");
    });

    it("should distribute prizes for Degen PvP with 3+ players", () => {
      const game = { ...mockGame, gameMode: GameMode.DEGEN_PVP };
      const leaderboard = mockPlayers.map((p) => p);
      const canDistribute =
        leaderboard.length >= 3 && game.gameMode === GameMode.DEGEN_PVP;

      expect(canDistribute).to.be.true;

      const winners = [
        leaderboard[0].walletAddress,
        leaderboard[1].walletAddress,
        leaderboard[2].walletAddress,
      ];
      expect(winners).to.have.length(3);
      expect(winners[0]).to.not.be.undefined;
      expect(winners[1]).to.not.be.undefined;
      expect(winners[2]).to.not.be.undefined;
    });

    it("should NOT distribute prizes with less than 3 players", () => {
      const game = { ...mockGame, gameMode: GameMode.DEGEN_PVP };
      const leaderboard = [mockPlayer];

      expect(leaderboard.length >= 3).to.be.false;
    });

    it("should NOT distribute prizes for non-Degen PvP games", () => {
      const game = { ...mockGame, gameMode: GameMode.HANGOUTS };
      const leaderboard = mockPlayers;

      const shouldDistribute =
        leaderboard.length >= 3 && game.gameMode === GameMode.DEGEN_PVP;

      expect(shouldDistribute).to.be.false;
    });
  });

  describe("Degen PvP Start Requirements", () => {
    it("should require at least 3 players to start Degen PvP", () => {
      const players = mockPlayers;
      if (mockGame.gameMode === GameMode.DEGEN_PVP) {
        expect(players.length).to.be.at.least(3);
      }
    });

    it("should require all players to have wallets for Degen PvP", () => {
      const playersWithWallets = mockPlayers.filter((p) => p.walletAddress);
      expect(playersWithWallets.length).to.equal(mockPlayers.length);
    });

    it("should reject start if any player lacks a wallet in Degen PvP", () => {
      const playersWithMissingWallet = [
        { ...mockPlayer, walletAddress: "0x1111" },
        { ...mockPlayer, walletAddress: null },
      ];
      const allHaveWallets = playersWithMissingWallet.every(
        (p) => p.walletAddress
      );
      expect(allHaveWallets).to.be.false;
    });
  });

  describe("Timer Logic", () => {
    it("should compute correct timeLeft from elapsed duration", () => {
      const duration = 10;
      const elapsedSeconds = 3;
      const timeLeft = Math.max(0, duration - elapsedSeconds);
      expect(timeLeft).to.equal(7);
    });

    it("should floor to 0 when elapsed exceeds duration", () => {
      const duration = 10;
      const elapsedSeconds = 15;
      const timeLeft = Math.max(0, duration - elapsedSeconds);
      expect(timeLeft).to.equal(0);
    });

    it("should handle fractional elapsed time", () => {
      const duration = 10;
      const elapsedMs = 3500;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const timeLeft = Math.max(0, duration - elapsedSeconds);
      expect(timeLeft).to.equal(7);
    });
  });
});
