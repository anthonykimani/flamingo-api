// models/player.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Game } from './game.entity';

@Entity('players')
export class Player {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    playerName: string;

    @Column({ nullable: true })
    walletAddress?: string;

    @ManyToOne(() => Game, game => game.players)
    gameSession: Game;

    @Column({ default: 0 })
    totalScore: number;

    @Column({ default: 0 })
    correctAnswers: number;

    @Column({ default: 0 })
    wrongAnswers: number;

    @Column({ default: 0 })
    currentStreak: number;

    @Column({ default: 0 })
    bestStreak: number;

    @Column({ default: false })
    hasAnsweredCurrent: boolean;

    @Column({ default: false })
    hasDeposited?: boolean;

    @Column({ nullable: true })
    depositAmount?: string;

    @Column({ nullable: true, type: 'timestamp' })
    depositedAt?: Date;

    @Column({ default: false })
    deleted: boolean;
}