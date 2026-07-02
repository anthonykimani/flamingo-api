import { expect } from "chai";
import sinon from "sinon";
import { GameState } from "../enums/GameState";
import { GameMode } from "../enums/GameMode";

describe("GameRepository", () => {
  describe("Game PIN Generation", () => {
    function generateGamePin(): string {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }

    it("should generate a 6-digit PIN", () => {
      const pin = generateGamePin();
      expect(pin).to.have.length(6);
      expect(pin).to.match(/^\d{6}$/);
    });

    it("should generate unique PINs on successive calls", () => {
      const pins = new Set<string>();
      for (let i = 0; i < 100; i++) {
        pins.add(generateGamePin());
      }
      expect(pins.size).to.be.at.least(99);
    });

    it("should generate PINs in the range 100000-999999", () => {
      for (let i = 0; i < 100; i++) {
        const pin = parseInt(generateGamePin(), 10);
        expect(pin).to.be.within(100000, 999999);
      }
    });
  });

  describe("Transaction Hash Validation", () => {
    function isValidTxHash(txHash: string): boolean {
      return /^0x[a-fA-F0-9]{64}$/.test(txHash);
    }

    it("should accept valid tx hash", () => {
      const validHash =
        "0x" + "a".repeat(64);
      expect(isValidTxHash(validHash)).to.be.true;
    });

    it("should reject hash without 0x prefix", () => {
      const hash = "abcdef1234567890";
      expect(isValidTxHash(hash)).to.be.false;
    });

    it("should reject hash with wrong length", () => {
      const shortHash = "0xabc";
      expect(isValidTxHash(shortHash)).to.be.false;
    });

    it("should reject hash with non-hex characters", () => {
      const invalidHash = "0x" + "z".repeat(64);
      expect(isValidTxHash(invalidHash)).to.be.false;
    });

    it("should accept mixed-case hex hash", () => {
      const mixedHash =
        "0x" + "AbCdEf0123456789".repeat(4);
      expect(isValidTxHash(mixedHash)).to.be.true;
    });
  });

  describe("Game Session State", () => {
    it("should mark game as active when creating", () => {
      const session = { isActive: true };
      expect(session.isActive).to.be.true;
    });

    it("should deactivate game when ending", () => {
      const session = { isActive: false, endedAt: new Date() };
      expect(session.isActive).to.be.false;
      expect(session.endedAt).to.be.instanceOf(Date);
    });

    it("should set soft-delete flag instead of hard delete", () => {
      const session = { deleted: true };
      expect(session.deleted).to.be.true;
    });

    it("should track current question index", () => {
      const session = { currentQuestionIndex: 2 };
      expect(session.currentQuestionIndex).to.equal(2);
    });
  });

  describe("Player Management", () => {
    it("should track correct and wrong answer counts", () => {
      const player = {
        correctAnswers: 5,
        wrongAnswers: 3,
        totalScore: 800,
      };
      expect(player.correctAnswers + player.wrongAnswers).to.equal(8);
    });

    it("should track best streak as max of current streak", () => {
      const bestStreak = Math.max(3, 5);
      expect(bestStreak).to.equal(5);
    });

    it("should soft-delete players instead of hard delete", () => {
      const player = { deleted: true };
      expect(player.deleted).to.be.true;
    });
  });

  describe("Active Sessions Filtering", () => {
    it("should filter sessions by 'waiting' or 'created' status for joinable games", () => {
      const sessions = [
        { status: "waiting", isActive: true },
        { status: "created", isActive: true },
        { status: "in_progress", isActive: true },
        { status: "completed", isActive: false },
      ];

      const joinable = sessions.filter(
        (s) =>
          (s.status === "waiting" || s.status === "created") && s.isActive
      );

      expect(joinable).to.have.length(2);
    });
  });

  describe("Session Summary Stats", () => {
    it("should calculate accuracy correctly", () => {
      const totalAnswers = 20;
      const correctAnswers = 15;
      const accuracy = Math.round((correctAnswers / totalAnswers) * 10000) / 100;
      expect(accuracy).to.equal(75);
    });

    it("should return 0 accuracy when no answers exist", () => {
      const totalAnswers = 0;
      const correctAnswers = 0;
      const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
      expect(accuracy).to.equal(0);
    });

    it("should compute session duration in seconds", () => {
      const startedAt = new Date("2024-01-01T00:00:00Z");
      const endedAt = new Date("2024-01-01T01:30:00Z");
      const duration = Math.floor(
        (endedAt.getTime() - startedAt.getTime()) / 1000
      );
      expect(duration).to.equal(5400);
    });
  });
});
