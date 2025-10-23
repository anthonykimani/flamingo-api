import { BaseEntity, Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PlayerAnswer } from "./player-answer.entity";
import { Player } from "./player.entity";
import { GameState } from "../enums/GameState";
import { Quiz } from "./quiz.entity";

@Entity("games")
export class Game extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ length: 10, unique: true })
    gamePin: string;

    @ManyToOne(() => Quiz, (quiz: Quiz) => quiz.games)
    quiz: Quiz;

    @Column({ length: 100, nullable: true })
    gameTitle: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    entryFee: string;

    @Column({ nullable: true })
    maxPlayers: number;

    @Column({
        type: "enum",
        enum: GameState,
        default: GameState.CREATED,
    })
    status: GameState;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    endedAt: Date;

    // FIX: Add players relation
    @OneToMany(() => Player, (player) => player.gameSession, {
        cascade: true
    })
    players: Player[];

    @OneToMany(() => PlayerAnswer, (answer) => answer.gameSession, {
        cascade: true,
        onDelete: "CASCADE"
    })
    playerAnswers: PlayerAnswer[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ default: false })
    deleted: boolean;
}