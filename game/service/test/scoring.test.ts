import { expect } from "chai";

describe("Scoring Logic", () => {
  const questionDuration = 10;

  function calculateScore(
    isCorrect: boolean,
    currentStreak: number,
    timeToAnswer: number
  ): { pointsEarned: number; newStreak: number } {
    if (!isCorrect) {
      return { pointsEarned: 0, newStreak: 0 };
    }

    const newStreak = currentStreak + 1;
    let pointsEarned = 100;
    pointsEarned += newStreak * 50;
    const timeBonusPercent = Math.max(
      0,
      (questionDuration - timeToAnswer) / questionDuration
    );
    const timeBonus = Math.floor(timeBonusPercent * 50);
    pointsEarned += timeBonus;

    return { pointsEarned, newStreak };
  }

  describe("Correct Answers", () => {
    it("should award 100 base points for a correct answer", () => {
      const result = calculateScore(true, 0, 5);
      expect(result.pointsEarned).to.be.at.least(100);
    });

    it("should add streak bonus of (streak * 50)", () => {
      const noStreak = calculateScore(true, 0, 5);
      const withStreak = calculateScore(true, 3, 5);
      expect(withStreak.pointsEarned - noStreak.pointsEarned).to.equal(
        4 * 50 - 1 * 50
      );
    });

    it("should add time bonus up to 50 points for instant answers", () => {
      const fast = calculateScore(true, 0, 0);
      const slow = calculateScore(true, 0, 10);
      expect(fast.pointsEarned).to.be.at.least(slow.pointsEarned);
      expect(fast.pointsEarned - slow.pointsEarned).to.be.at.most(50);
    });

    it("should give max time bonus (50) when timeToAnswer is 0", () => {
      const result = calculateScore(true, 0, 0);
      // 100 base + 50 streak(1*50) + 50 time bonus
      expect(result.pointsEarned).to.equal(200);
    });

    it("should give 0 time bonus when timeToAnswer equals duration", () => {
      const result = calculateScore(true, 0, 10);
      // 100 base + 50 streak(1*50) + 0 time bonus
      expect(result.pointsEarned).to.equal(150);
    });

    it("should floor time bonus to integer", () => {
      const result = calculateScore(true, 0, 3);
      const expectedBonus = Math.floor((7 / 10) * 50);
      expect(result.pointsEarned).to.equal(100 + expectedBonus + 50);
    });

    it("should increase streak by 1 on correct answer", () => {
      const result = calculateScore(true, 2, 5);
      expect(result.newStreak).to.equal(3);
    });
  });

  describe("Wrong Answers", () => {
    it("should award 0 points for wrong answer", () => {
      const result = calculateScore(false, 3, 5);
      expect(result.pointsEarned).to.equal(0);
    });

    it("should reset streak to 0 on wrong answer", () => {
      const result = calculateScore(false, 5, 3);
      expect(result.newStreak).to.equal(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero streak correctly", () => {
      const result = calculateScore(true, 0, 5);
      expect(result.pointsEarned).to.equal(100 + 50 + Math.floor((5 / 10) * 50));
    });

    it("should never return negative time bonus", () => {
      const result = calculateScore(true, 0, 15);
      expect(result.pointsEarned).to.equal(100 + 50);
    });

    it("should handle very long streaks", () => {
      const result = calculateScore(true, 100, 0);
      expect(result.pointsEarned).to.equal(100 + 101 * 50 + 50);
      expect(result.newStreak).to.equal(101);
    });
  });

  describe("Leaderboard Sorting", () => {
    it("should sort by totalScore descending, then bestStreak descending", () => {
      const players = [
        { name: "Alice", totalScore: 300, bestStreak: 3 },
        { name: "Bob", totalScore: 500, bestStreak: 5 },
        { name: "Charlie", totalScore: 300, bestStreak: 1 },
      ];

      players.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.bestStreak - a.bestStreak;
      });

      expect(players[0].name).to.equal("Bob");
      expect(players[1].name).to.equal("Alice");
      expect(players[2].name).to.equal("Charlie");
    });
  });
});
