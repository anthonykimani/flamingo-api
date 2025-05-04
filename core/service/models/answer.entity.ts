import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, BaseEntity, JoinColumn } from "typeorm";
import { Question } from "./question.entity";

@Entity("answers")
export class Answer extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    answer: string;

    @Column({ default: false })
    correctAnswer: boolean;

    @ManyToOne(() => Question, (question: Question) => question.answers, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "questionId" })
    question: Question;

    @Column({ type: 'uuid' })
    questionId: string;

    @CreateDateColumn()
    createdAt: Date;
}
