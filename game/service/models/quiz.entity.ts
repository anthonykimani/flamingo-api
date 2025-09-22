import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Question } from "./question.entity";
import { Game } from "./game.entity";


@Entity("quizzes")
export class Quiz extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ length: 100, nullable: false })
    title: string;

    @Column({ length: 100, nullable: false })
    description: string;

    @Column({ type: 'boolean', default: false })
    isPublished: boolean;

    @OneToMany(() => Question, (question) => question.quiz, {
                cascade: true,
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
    })
    questions: Question[];

    @OneToMany(() => Game, (game: Game) => game.quiz, {
                cascade: true,
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
    })
    games: Game[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ default: false })
    deleted: boolean;
}
