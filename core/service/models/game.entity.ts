import { BaseEntity, Column, PrimaryGeneratedColumn } from "typeorm";
import { IQuestion } from "../interfaces/IQuestion";


export class Game extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id:string;
    @Column({length: 100, nullable: false})
    gameTitle: string;
    @Column("simple-json", {nullable: false})
    questions: IQuestion[];
    @Column({type: "timestamp", nullable: false})
    created: Date;
}