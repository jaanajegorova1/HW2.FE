"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const pg_1 = require("pg");
require('dotenv').config();
const PORT = process.env.PORT;
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
const pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || ''),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});
const init = () => {
    return new Promise((resolve, reject) => {
        pool
            .connect()
            .then(() => resolve(true))
            .catch(() => reject());
    });
};
app.get(`/users`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows: users } = yield pool.query(`
            SELECT * FROM users;
            `);
        res.status(200).json({ users });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
app.get(`/user`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.query;
        const { rows: users } = yield pool.query(`
            SELECT * FROM users WHERE username = $1;
            `, [username]);
        if (users.length === 0)
            throw new Error(`SUCH USER DAES NOT EXIST`);
        res.status(200).json({ user: users[0] });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
app.post(`/user`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("BODY: ", req.body);
    // res.status(200).send(true);
    try {
        const { username } = req.body;
        const { rows: users } = yield pool.query(`
            SELECT * FROM users WHERE username = $1;
            `, [username]);
        if (users.length > 0)
            throw new Error(`SUCH USERNAME IS TAKEN`);
        yield pool.query(`
            INSERT INTO users(username) VALUES($1)
            `, [username]);
        const { rows: createdUser } = yield pool.query(`
            SELECT * FROM users WHERE username = $1;
                `, [username]);
        /* if (users.length === 0) throw new Error(`SUCH USER DAES NOT EXIST`); */
        res.status(200).json({ user: createdUser[0] });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
// const test = async () => {
//     const { rows } = await pool.query(`
//         SELECT * FROM messages;
//         `);
//     console.log("ROWS: ", rows);
// };
init().then(() => {
    app.listen(PORT, () => {
        // test();
        console.log('APP IS RUNNING ON PORT: ' + PORT);
    });
});
