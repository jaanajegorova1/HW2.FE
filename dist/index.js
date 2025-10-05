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
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = __importDefault(require("crypto"));
const multer_1 = __importDefault(require("multer"));
const pg_1 = require("pg");
const uploadPath = path_1.default.join(process.cwd(), 'uploads');
const upload = (0, multer_1.default)({
    dest: uploadPath,
    // limits: { filesize: 5 * 1024 * 1024, files: 3 }, //uploading allows max 3 files, not more!!!
    limits: { fileSize: 5 * 1024 * 1024 },
});
const sha256 = (buf) => crypto_1.default.createHash('sha256').update(buf).digest('hex');
// console.log('upload path: ', uploadPath);
require('dotenv').config();
const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;
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
app.post(`/user`, upload.single('avatar'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("BODY: ", req.body);
    // res.status(200).send(true);
    try {
        const { username } = req.body;
        res.status(200).send(true);
        const { rows: users } = yield pool.query(`
            SELECT * FROM users WHERE username = $1;
            `, [username]);
        if (users.length > 0)
            throw new Error(`SUCH USERNAME IS TAKEN`);
        //if (!req.file) throw new Error("AVATAR IS REQUIRED");   //eto esli avatar objazatelen
        let pathForDB = null; //if user created without avatar
        if (req.file) {
            const { path: tmpPath } = req.file;
            const buf = yield promises_1.default.readFile(tmpPath);
            // console.log('BUF: ', buf);
            const hash = sha256(buf);
            // console.log("HASH: ", hash);
            const fileName = `user_${username}_${hash}.webp`;
            // console.log("FILE NAME: ", fileName);
            const finalPath = path_1.default.join(uploadPath, fileName);
            // console.log("FINAL PATH: ", finalPath);
            yield (0, sharp_1.default)(buf).resize(512).webp({ quality: 95 }).toFile(finalPath);
            yield promises_1.default.rm(tmpPath, { force: true });
            const pathForDB = `/uploads/${fileName}`; //esli pathForDB not null, to on pereopredelitsja
            // console.log("pathForDB: ", pathForDB);
        }
        // res.status(200).send(true);
        yield pool.query(`
            INSERT INTO users(username, avatar) VALUES($1, $2)
            `, [username, pathForDB]);
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
//   const { rows } = await pool.query(`
//         SELECT * FROM messages;
//         `);
//   console.log('ROWS: ', rows);
// };
app.patch(`/user`, upload.single(`avatar`), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.body;
        const { rows: users } = yield pool.query(`
    SELECT * FROM users WHERE username = $1
    `, [username]);
        if (!users[0])
            throw new Error(`User not found`);
        let pathForDB = null;
        if (req.file) {
            const { path: tmpPath } = req.file;
            const buf = yield promises_1.default.readFile(tmpPath);
            const hash = sha256(buf);
            const fileName = `user_${username}_${hash}.webp`;
            const finalPath = path_1.default.join(uploadPath, fileName);
            yield (0, sharp_1.default)(buf).resize(512).webp({ quality: 95 }).toFile(finalPath);
            yield promises_1.default.rm(tmpPath, { force: true });
            const pathForDB = `/uploads/${fileName}`;
        }
        console.log('pathForDB :', pathForDB);
        yield pool.query(`
          UPDATE users SET avatar = $1 WHERE username = $2;
        `, [pathForDB, username]);
        const { rows: updatedUsers } = yield pool.query(`
          SELECT * FROM users WHERE username = $1;
        `, [username]);
        console.log('updatedUsers: ', updatedUsers);
        res.status(200).json({ user: updatedUsers[0] });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
app.get('/messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows: messages } = yield pool.query(`
      SELECT messages.uuid AS uuid,
messages.content AS content,
// messages.created_at AS created_at,
messages.updated_at AS updated_at,
users.username AS username,
users.avatar AS avatar,
CASE WHEN messages.created_at = messages.updated_at THEN 'false' ELSE 'true' END AS was_edited
FROM messages LEFT JOIN users ON users.uuid = messages.author_uuid;
      `);
        res.status(200).json({ messages });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
app.post(`/message`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content, username } = req.body;
        // Validacija chto takoj polzovatel est. 73-135 stroki dlja app.post(`/user` kak primer
        //Validacija chto est kontent, chto nikto ne prishljot soobwenije s pustoj strochkoj
        if (!content)
            throw new Error(`No content provided`);
        const { rows: users } = yield pool.query(`
          SELECT * FROM users WHERE username=$1
        `, [username]);
        yield pool.query(`
      INSERT INTO messages(content, author_uuid) VALUES($1, $2)
      `, [content, users[0].uuid]);
        const { rows: messages } = yield pool.query(`
      SELECT * FROM messages WHERE author_uuid = 'e5842e20-f135-46a7-9046-87d760144aab'  ORDER BY created_at DESC;  
      `);
        res.status(200).json({ message: messages[0] });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
init().then(() => {
    app.listen(PORT, () => {
        // test();
        console.log('APP IS RUNNING ON PORT: ' + PORT);
    });
});
