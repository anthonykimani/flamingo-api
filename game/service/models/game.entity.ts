import { BaseEntity, Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Player } from "./player.entity";
import { GameState } from "../enums/GameState";
import { Quiz } from "./quiz.entity";

@Entity("games")
export class Game extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Quiz, (quiz: Quiz) => quiz.games)
    quiz: Quiz;

    @Column({ length: 100, nullable: false })
    gameTitle: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    entryFee: string;

    @Column()
    maxPlayers: number;

    @Column({
        type: "enum",
        enum: GameState,
        default: GameState.CREATED,
    })
    status: GameState;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Player, (player: Player) => player.game, {
                cascade: true,
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
    })
    gamePlayers: Player[];

    @Column({ default: false })
    deleted: boolean;
}