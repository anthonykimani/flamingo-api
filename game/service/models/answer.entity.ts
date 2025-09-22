import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Question } from "./question.entity";


@Entity("answers")
export class Answer extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text", nullable: true })
    answer: string;

    @Column({ type: "bool", default: false })
    correctAnswer: boolean;

    @ManyToOne(() => Question, (question: Question) => question.answers)
    question: Question;

    @Column({ default: false })
    deleted: boolean;
}
