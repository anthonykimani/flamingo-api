import dotenv from "dotenv";
import { join } from "path";
import { DataSource } from "typeorm";
import { Game } from "../models/game.entity";
import { PlayerAnswer } from "../models/player-answer.entity";
import { Player } from "../models/player.entity";
import { Quiz } from "../models/quiz.entity";
import { Question } from "../models/question.entity";
import { Answer } from "../models/answer.entity";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: Number(process.env.DB_SSL) ? true : false,
};

const AppDataSource = new DataSource({
    type: "postgres",
    host: config.host,
    port: 5432,
    username: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? {
        rejectUnauthorized: false,
        //ca: "",
        //key: "",
        //cert: "",
    } : config.ssl,
    entities: [
        Game,
        Quiz,
        PlayerAnswer,
        Player,
        Question,
        Answer
    ],
    synchronize: true,
    dropSchema: false,
    migrationsRun: true,
    logging: false,
    logger: "debug",
    migrations: [join(__dirname, "service/migration/**/*.ts")]
});

export default AppDataSource;