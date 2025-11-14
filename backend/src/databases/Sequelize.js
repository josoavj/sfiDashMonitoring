const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbName = process.env.DB_NAME;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;

let sequelize;
if (dbName && dbUsername) {
  sequelize = new Sequelize(dbName, dbUsername, dbPassword, {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mariadb',
    logging: false,
  });
} else {
  // fallback to sqlite file for local development when no DB provided
  const storagePath = path.resolve(__dirname, '../../data/backend.sqlite');
  sequelize = new Sequelize({ dialect: 'sqlite', storage: storagePath, logging: false });
}

module.exports = { sequelize };
