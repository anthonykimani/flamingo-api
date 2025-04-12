import { BaseEntity, Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { IQuestion } from "../interfaces/IQuiz";
import { Player } from "./player.entity";

@Entity("games")
export class Game extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id:string;

    @Column({ type: 'uuid' })
    quizId: string;

    @Column({length: 100, nullable: false})
    gameTitle: string;

    @Column({ length: 256 })
    @Index({ unique: true })
    address: string;
    
    @Column({ type: 'decimal', precision: 12, scale: 2 })
    entryFee: string;

    @Column()
    maxPlayers: number;

    @Column({ type: 'enum', enum: ['created', 'waiting', 'countdown', 'in_progress', 'results_ready', 'payout', 'completed'] })
    status: GameState;  

    @Column({type: "timestamp", nullable: false})
    created: Date;

    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
    
    @OneToMany(() => Player, (player: Player) => player.game, {
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
    })
    players: Player[]
}