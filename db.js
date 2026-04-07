const { Sequelize, DataTypes } = require("sequelize");

// Use environment variables so the DB can be run in a containerized environment.
const DB_NAME = process.env.DB_NAME || "postgres";
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASS = process.env.DB_PASS || "mysecretpassword";
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "postgres",
    logging: false,
});

const Submission = sequelize.define("Submission", {
    id: { type: DataTypes.UUID, primaryKey: true },
    code: { type: DataTypes.TEXT, allowNull: false },
    language: { type: DataTypes.TEXT, allowNull: false },
    input: { type: DataTypes.TEXT },
    output: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING, defaultValue: "Pending" },
    error: { type: DataTypes.TEXT }
});

sequelize.sync();

module.exports = { sequelize, Submission };
