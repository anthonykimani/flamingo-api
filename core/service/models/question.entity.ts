import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, BaseEntity } from "typeorm";
import { Quiz } from "./quiz.entity";
import { Answer } from "./answer.entity";

@Entity("question")
export class Question extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    question: string;

    @ManyToOne(() => Quiz, (quiz: Quiz) => quiz.questions, {
        onDelete: "CASCADE"
    })
    quiz: Quiz;

    @Column({ type: 'uuid' })
    quizId: string;

    @OneToMany(() => Answer, (answer: Answer) => answer.question, {
        cascade: true
    })
    answers: Answer[];

    @Column()
    answer: string;

    @CreateDateColumn()
    created: Date;
}
