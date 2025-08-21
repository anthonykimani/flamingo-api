import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { IQuestion, QUESTION } from "../interfaces/IQuiz";
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
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
    })
    questions: Question[];

    @OneToMany(() => Game, (game: Game) => game.quiz, {
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
    })
    games: Game[];
}
