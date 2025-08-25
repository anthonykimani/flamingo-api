import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    BaseEntity,
  } from 'typeorm';
import { Game } from './game.entity';

  @Entity('players')
  export class Player extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    address: string;  

    @Column({ nullable: true })
    userId?: string; 
  
    @ManyToOne(() => Game, (game: Game) => game.gamePlayers)
    @JoinColumn({ name: 'gameId' })
    game: Game;
  
    @Column({ type: 'uuid' })
    gameId: string;
  
    @Column({ type: 'jsonb', nullable: true })
    answers: Record<string, string>; // questionId → answerId
  
    @Column({ type: 'int', nullable: true })
    score?: number;
  
    @Column({ type: 'bool', default: false })
    isWinner: boolean;

    @Column({ type: 'bool', default: true })
    isActive: boolean;
  
    @CreateDateColumn()
    joinedAt: Date;
  }