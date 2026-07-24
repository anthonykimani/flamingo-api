import AppDataSource from "../configs/ormconfig";
import { Game } from "../models/game.entity";
import { Player } from "../models/player.entity";
import { PlayerAnswer } from "../models/player-answer.entity";
import { calculateScore } from "./scoring";

export interface SubmitAnswerInput {
    gameSessionId: string;
    playerName: string;
    questionId: string;
    answerId: string;
    timeToAnswer: number;
}

export type SubmitAnswerResult =
    | {
        ok: true;
        player: Player;
        answer: PlayerAnswer;
        isCorrect: boolean;
        pointsEarned: number;
        answerStreak: number;
    }
    | { ok: false; status: number; message: string };

/**
 * Shared, transactional answer submission used by both the HTTP
 * controller and the socket manager.
 *
 * Guarantees:
 *  - scoring is computed server-side only (single scoring module)
 *  - duplicate answers are impossible: checked under a row lock and
 *    backstopped by the unique constraint on (gameSession, playerName, question)
 *  - player stats + answer record are written atomically
 */
export async function submitAnswerForPlayer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
    const { gameSessionId, playerName, questionId, answerId, timeToAnswer } = input;

    if (!gameSessionId || !playerName || !questionId || !answerId) {
        return { ok: false, status: 400, message: "Missing required fields" };
    }

    try {
        return await AppDataSource.transaction<SubmitAnswerResult>(async (manager) => {
            const player = await manager.findOne(Player, {
                where: { gameSession: { id: gameSessionId }, playerName, deleted: false },
                lock: { mode: "pessimistic_write" },
            });
            if (!player) {
                return { ok: false, status: 404, message: "Player not found" };
            }

            const game = await manager.findOne(Game, {
                where: { id: gameSessionId, deleted: false },
                relations: ["quiz", "quiz.questions", "quiz.questions.answers"],
            });
            if (!game) {
                return { ok: false, status: 404, message: "Game not found" };
            }

            const question = game.quiz?.questions?.find((q) => q.id === questionId);
            if (!question) {
                return { ok: false, status: 404, message: "Question not found" };
            }

            const selectedAnswer = question.answers?.find((a) => a.id === answerId);
            if (!selectedAnswer) {
                return { ok: false, status: 404, message: "Answer not found" };
            }

            const existing = await manager.findOne(PlayerAnswer, {
                where: {
                    gameSession: { id: gameSessionId },
                    playerName,
                    question: { id: questionId },
                    deleted: false,
                },
            });
            if (existing || player.hasAnsweredCurrent) {
                return { ok: false, status: 400, message: "You have already answered this question" };
            }

            const isCorrect = selectedAnswer.correctAnswer;
            const { pointsEarned, answerStreak } = calculateScore({
                isCorrect,
                currentStreak: player.currentStreak || 0,
                timeToAnswer: timeToAnswer || 0,
                questionDuration: game.questionDuration || 10,
            });

            if (isCorrect) {
                player.totalScore = (player.totalScore || 0) + pointsEarned;
                player.correctAnswers = (player.correctAnswers || 0) + 1;
                player.currentStreak = answerStreak;
                player.bestStreak = Math.max(player.bestStreak || 0, answerStreak);
            } else {
                player.wrongAnswers = (player.wrongAnswers || 0) + 1;
                player.currentStreak = 0;
            }
            player.hasAnsweredCurrent = true;
            await manager.save(Player, player);

            const answer = manager.create(PlayerAnswer, {
                gameSession: { id: gameSessionId } as any,
                playerName,
                playerId: player.id,
                question: { id: questionId } as any,
                selectedAnswer: { id: answerId } as any,
                isCorrect,
                pointsEarned,
                answerStreak,
                timeToAnswer: timeToAnswer || 0,
            });
            const saved = await manager.save(PlayerAnswer, answer);

            return { ok: true, player, answer: saved, isCorrect, pointsEarned, answerStreak };
        });
    } catch (error: any) {
        // Unique-constraint backstop: a concurrent insert slipped past the check
        if (error?.code === "23505") {
            return { ok: false, status: 400, message: "You have already answered this question" };
        }
        throw error;
    }
}
