import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { User } from "../models/user.entity";
import { AuthNonce } from "../models/nonce.entity";

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
    port: Number(config.port) || 5432,
    username: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? {
        rejectUnauthorized: false,
    } : config.ssl,
    entities: [
        User,
        AuthNonce
    ],
    synchronize: true,
    dropSchema: false,
    logging: false,
});

export = AppDataSource;
