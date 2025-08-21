import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Quiz } from "./quiz.entity";
import { Answer } from "./answer.entity";

@Entity("questions")
export class Question extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Quiz, (quiz) => quiz.questions, {
        onDelete: "CASCADE"
    })
    quiz: Quiz;

    @Column({ type: "text", nullable: true })
    question: string;

    @OneToMany(() => Answer, (answer) => answer.question, {
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
    })
    answer: Answer[];

    @CreateDateColumn()
    createdAt: Date;

}