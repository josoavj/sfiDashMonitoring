import { Sequelize } from "sequelize";
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;

export const sequelize = new Sequelize(`${dbName}`, `${dbUsername}`, `${dbPassword}`, {
  host: "localhost",
  dialect: "mariadb",
});
