import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Game } from "./game.entity";

@Entity("players")
export class Player extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ length: 100 })
    playerName: string;

    @ManyToOne(() => Game, {
        onDelete: "CASCADE"
    })
    gameSession: Game;

    @Column({ type: 'int', default: 0 })
    totalScore: number;

    @Column({ type: 'int', default: 0 })
    correctAnswers: number;

    @Column({ type: 'int', default: 0 })
    wrongAnswers: number;

    @Column({ type: 'int', default: 0 })
    currentStreak: number;

    @Column({ type: 'int', default: 0 })
    bestStreak: number;

    @CreateDateColumn()
    joinedAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ default: false })
    deleted: boolean;
}