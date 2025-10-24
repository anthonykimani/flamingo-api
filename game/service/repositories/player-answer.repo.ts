import { Repository } from "typeorm";
import AppDataSource from "../configs/ormconfig";
import { PlayerAnswer } from "../models/player-answer.entity";
import dotenv from "dotenv";

export class PlayerAnswerRepository {
    private repo: Repository<PlayerAnswer>;

    constructor() {
        this.repo = AppDataSource.getRepository(PlayerAnswer);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    /**
     * Save a player's answer
     */
    async saveAnswer(data: {
        gameSessionId: string;
        playerName: string;
        questionId: string;
        answerId: string;
        isCorrect: boolean;
        pointsEarned: number;
        answerStreak: number;
        timeToAnswer: number;
    }): Promise<PlayerAnswer> {
        try {
            const answer = this.repo.create({
                gameSession: { id: data.gameSessionId } as any,
                playerName: data.playerName,
                question: { id: data.questionId } as any,
                selectedAnswer: { id: data.answerId } as any,
                isCorrect: data.isCorrect,
                pointsEarned: data.pointsEarned,
                answerStreak: data.answerStreak,
                timeToAnswer: data.timeToAnswer,
                answeredAt: new Date()
            });

            return await this.repo.save(answer);
        } catch (error) {
            console.error('Error saving answer:', error);
            throw error;
        }
    }

    /**
     * Get all answers for a player in a game session
     */
    async getPlayerAnswers(gameSessionId: string, playerName: string): Promise<PlayerAnswer[]> {
        try {
            return await this.repo.find({
                where: {
                    gameSession: { id: gameSessionId },
                    playerName,
                    deleted: false
                },
                relations: ['question', 'selectedAnswer'],
                order: { answeredAt: 'ASC' }
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all answers for a specific question in a game
     */
    async getQuestionAnswers(gameSessionId: string, questionId: string): Promise<PlayerAnswer[]> {
        try {
            return await this.repo.find({
                where: {
                    gameSession: { id: gameSessionId },
                    question: { id: questionId },
                    deleted: false
                },
                relations: ['question', 'selectedAnswer'],
                order: { answeredAt: 'ASC' }
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get answer statistics for a question
     */
    async getQuestionStats(gameSessionId: string, questionId: string): Promise<{
        totalAnswers: number;
        correctAnswers: number;
        wrongAnswers: number;
        averageTime: number;
    }> {
        try {
            const answers = await this.getQuestionAnswers(gameSessionId, questionId);

            const totalAnswers = answers.length;
            const correctAnswers = answers.filter(a => a.isCorrect).length;
            const wrongAnswers = totalAnswers - correctAnswers;
            const averageTime = totalAnswers > 0 
                ? answers.reduce((sum, a) => sum + a.timeToAnswer, 0) / totalAnswers 
                : 0;

            return {
                totalAnswers,
                correctAnswers,
                wrongAnswers,
                averageTime: Math.round(averageTime * 100) / 100
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if player has already answered a question
     */
    async hasPlayerAnswered(gameSessionId: string, playerName: string, questionId: string): Promise<boolean> {
        try {
            const answer = await this.repo.findOne({
                where: {
                    gameSession: { id: gameSessionId },
                    playerName,
                    question: { id: questionId },
                    deleted: false
                }
            });

            return !!answer;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get player's answer for a specific question
     */
    async getPlayerQuestionAnswer(
        gameSessionId: string, 
        playerName: string, 
        questionId: string
    ): Promise<PlayerAnswer | null> {
        try {
            return await this.repo.findOne({
                where: {
                    gameSession: { id: gameSessionId },
                    playerName,
                    question: { id: questionId },
                    deleted: false
                },
                relations: ['question', 'selectedAnswer']
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all answers for a game session
     */
    async getGameAnswers(gameSessionId: string): Promise<PlayerAnswer[]> {
        try {
            return await this.repo.find({
                where: {
                    gameSession: { id: gameSessionId },
                    deleted: false
                },
                relations: ['question', 'selectedAnswer'],
                order: { answeredAt: 'ASC' }
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete all answers for a game session (soft delete)
     */
    async deleteGameAnswers(gameSessionId: string): Promise<boolean> {
        try {
            await this.repo.update(
                { gameSession: { id: gameSessionId } },
                { deleted: true }
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get leaderboard based on answers
     */
    async getAnswerLeaderboard(gameSessionId: string): Promise<any[]> {
        try {
            const answers = await this.getGameAnswers(gameSessionId);

            // Group by player
            const playerStats = answers.reduce((acc, answer) => {
                if (!acc[answer.playerName]) {
                    acc[answer.playerName] = {
                        playerName: answer.playerName,
                        totalPoints: 0,
                        correctAnswers: 0,
                        totalAnswers: 0,
                        averageTime: 0
                    };
                }

                acc[answer.playerName].totalPoints += answer.pointsEarned;
                acc[answer.playerName].totalAnswers += 1;
                if (answer.isCorrect) {
                    acc[answer.playerName].correctAnswers += 1;
                }

                return acc;
            }, {} as Record<string, any>);

            // Convert to array and sort
            return Object.values(playerStats).sort((a, b) => b.totalPoints - a.totalPoints);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get answer distribution for a question (how many chose each answer)
     */
    async getAnswerDistribution(gameSessionId: string, questionId: string): Promise<any[]> {
        try {
            const answers = await this.getQuestionAnswers(gameSessionId, questionId);

            const distribution = answers.reduce((acc, answer) => {
                const answerId = answer.selectedAnswer.id;
                if (!acc[answerId]) {
                    acc[answerId] = {
                        answerId,
                        answerText: answer.selectedAnswer.answer,
                        isCorrect: answer.selectedAnswer.correctAnswer,
                        count: 0,
                        percentage: 0
                    };
                }
                acc[answerId].count += 1;
                return acc;
            }, {} as Record<string, any>);

            // Calculate percentages
            const total = answers.length;
            Object.values(distribution).forEach((item: any) => {
                item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
            });

            return Object.values(distribution);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get fastest answers for a question
     */
    async getFastestAnswers(gameSessionId: string, questionId: string, limit: number = 10): Promise<PlayerAnswer[]> {
        try {
            return await this.repo.find({
                where: {
                    gameSession: { id: gameSessionId },
                    question: { id: questionId },
                    isCorrect: true,
                    deleted: false
                },
                relations: ['question', 'selectedAnswer'],
                order: { timeToAnswer: 'ASC' },
                take: limit
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get player's total correct answers in a game
     */
    async getPlayerCorrectCount(gameSessionId: string, playerName: string): Promise<number> {
        try {
            const count = await this.repo.count({
                where: {
                    gameSession: { id: gameSessionId },
                    playerName,
                    isCorrect: true,
                    deleted: false
                }
            });

            return count;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get player's total points earned in a game
     */
    async getPlayerTotalPoints(gameSessionId: string, playerName: string): Promise<number> {
        try {
            const answers = await this.getPlayerAnswers(gameSessionId, playerName);
            return answers.reduce((sum, answer) => sum + answer.pointsEarned, 0);
        } catch (error) {
            return 0;
        }
    }
}