/**
 * Single source of truth for answer scoring.
 * Used by the HTTP controller and the socket manager (previously
 * the formula was copy-pasted in four places and had drifted).
 */

export const BASE_POINTS = 100;
export const STREAK_BONUS = 50;
export const MAX_TIME_BONUS = 50;

export interface ScoreInput {
    isCorrect: boolean;
    /** Player's streak BEFORE this answer */
    currentStreak: number;
    /** Seconds the player took to answer */
    timeToAnswer: number;
    /** Seconds allowed for the question */
    questionDuration: number;
}

export interface ScoreResult {
    pointsEarned: number;
    /** Player's streak AFTER this answer */
    answerStreak: number;
}

export function calculateScore(input: ScoreInput): ScoreResult {
    if (!input.isCorrect) {
        return { pointsEarned: 0, answerStreak: 0 };
    }

    const answerStreak = input.currentStreak + 1;
    const duration = input.questionDuration > 0 ? input.questionDuration : 10;
    const timeToAnswer = Math.max(0, input.timeToAnswer || 0);

    const timeBonusPercent = Math.max(0, (duration - timeToAnswer) / duration);
    const timeBonus = Math.floor(timeBonusPercent * MAX_TIME_BONUS);

    const pointsEarned = BASE_POINTS + answerStreak * STREAK_BONUS + timeBonus;

    return { pointsEarned, answerStreak };
}
