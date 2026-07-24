import { expect } from "chai";
import {
  calculateScore,
  BASE_POINTS,
  STREAK_BONUS,
  MAX_TIME_BONUS,
} from "../utils/scoring";

describe("Scoring Logic (production module)", () => {
  const questionDuration = 10;

  describe("Correct Answers", () => {
    it("should award at least the base points for a correct answer", () => {
      const result = calculateScore({ isCorrect: true, currentStreak: 0, timeToAnswer: 5, questionDuration });
      expect(result.pointsEarned).to.be.at.least(BASE_POINTS);
    });

    it("should add streak bonus of (newStreak * 50)", () => {
      const noStreak = calculateScore({ isCorrect: true, currentStreak: 0, timeToAnswer: 5, questionDuration });
      const withStreak = calculateScore({ isCorrect: true, currentStreak: 3, timeToAnswer: 5, questionDuration });
      expect(withStreak.pointsEarned - noStreak.pointsEarned).to.equal(
        4 * STREAK_BONUS - 1 * STREAK_BONUS
      );
    });

    it("should add time bonus up to 50 points for instant answers", () => {
      const fast = calculateScore({ isCorrect: true, currentStreak: 0, timeToAnswer: 0, questionDuration });
      const slow = calculateScore({ isCorrect: true, currentStreak: 0, timeToAnswer: 10, questionDuration });
      expect(fast.pointsEarned).to.be.at.least(slow.pointsEarned);
      expect(fast.pointsEarned - slow.pointsEarned).to.be.at.most(MAX_TIME_BONUS);
    });

    it("should give max time bonus (50) when timeToAnswer is 0", () => {
      const result = calculateScore({ isCorrect: true, currentStreak: 0, timeToAnswer: 0, questionDuration });
      // 100 base + 50 streak(1*50) + 50 time bonus
      expect(result.pointsEarned).to.equal(200);
    });

    it("should give 0 time bonus when timeToAnswer equals duration", () => {
      const result = calculateScore({ isCorrect: true, currentStreak: 0, timeToAnswer: 10, questionDuration });
      // 100 base + 50 streak(1*50) + 0 time bonus
      expect(result.pointsEarned).to.equal(150);
    });

    it("should floor time bonus to integer", () => {
      const result = calculateScore({ isCorrect: true, currentStreak: 0, timeToAnswer: 3, questionDuration });
      const expectedBonus = Math.floor((7 / 10) * MAX_TIME_BONUS);
      expect(result.pointsEarned).to.equal(BASE_POINTS + STREAK_BONUS + expectedBonus);
    });

    it("should increase streak by 1 on correct answer", () => {
      const result = calculateScore({ isCorrect: true, currentStreak: 2, timeToAnswer: 5, questionDuration });
      expect(result.answerStreak).to.equal(3);
    });
  });

  describe("Wrong Answers", () => {
    it("should award 0 points for wrong answer", () => {
      const result = calculateScore({ isCorrect: false, currentStreak: 3, timeToAnswer: 5, questionDuration });
      expect(result.pointsEarned).to.equal(0);
    });

    it("should reset streak to 0 on wrong answer", () => {
      const result = calculateScore({ isCorrect: false, currentStreak: 5, timeToAnswer: 3, questionDuration });
      expect(result.answerStreak).to.equal(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero streak correctly", () => {
      const result = calculateScore({ isCorrect: true, currentStreak: 0, timeToAnswer: 5, questionDuration });
      expect(result.pointsEarned).to.equal(BASE_POINTS + STREAK_BONUS + Math.floor((5 / 10) * MAX_TIME_BONUS));
    });

    it("should never return negative time bonus when overtime", () => {
      const result = calculateScore({ isCorrect: true, currentStreak: 0, timeToAnswer: 15, questionDuration });
      expect(result.pointsEarned).to.equal(BASE_POINTS + STREAK_BONUS);
    });

    it("should handle negative timeToAnswer as instant", () => {
      const result = calculateScore({ isCorrect: true, currentStreak: 0, timeToAnswer: -3, questionDuration });
      expect(result.pointsEarned).to.equal(200);
    });

    it("should fall back to 10s duration when questionDuration is 0", () => {
      const result = calculateScore({ isCorrect: true, currentStreak: 0, timeToAnswer: 5, questionDuration: 0 });
      expect(result.pointsEarned).to.equal(BASE_POINTS + STREAK_BONUS + Math.floor((5 / 10) * MAX_TIME_BONUS));
    });

    it("should handle very long streaks", () => {
      const result = calculateScore({ isCorrect: true, currentStreak: 100, timeToAnswer: 0, questionDuration });
      expect(result.pointsEarned).to.equal(BASE_POINTS + 101 * STREAK_BONUS + MAX_TIME_BONUS);
      expect(result.answerStreak).to.equal(101);
    });
  });
});
