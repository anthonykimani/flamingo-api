import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Game } from "./game.entity";
import { Question } from "./question.entity";
import { Answer } from "./answer.entity";

@Entity("player_answers")
export class PlayerAnswer extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Game, (session) => session.playerAnswers, {
        onDelete: "CASCADE"
    })
    gameSession: Game;

    @Column({ length: 100 })
    playerName: string;

    @Column({ nullable: true })
    playerId: string; 

    @ManyToOne(() => Question, {
        onDelete: "CASCADE"
    })
    question: Question;

    @ManyToOne(() => Answer, {
        onDelete: "CASCADE"
    })
    selectedAnswer: Answer;

    @Column({ type: 'boolean' })
    isCorrect: boolean;

    @Column({ type: 'int', default: 0 })
    pointsEarned: number;

    @Column({ type: 'int', default: 0 })
    answerStreak: number;

    @Column({ type: 'int', default: 0 })
    timeToAnswer: number; 

    @CreateDateColumn()
    answeredAt: Date;

    @Column({ default: false })
    deleted: boolean;
}