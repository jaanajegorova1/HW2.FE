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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var express_1 = require("express");
var body_parser_1 = require("body-parser");
var path_1 = require("path");
var promises_1 = require("fs/promises");
var sharp_1 = require("sharp");
var crypto_1 = require("crypto");
var multer_1 = require("multer");
var pg_1 = require("pg");
var uploadPath = path_1["default"].join(process.cwd(), 'uploads');
var upload = multer_1["default"]({
    dest: uploadPath,
    // limits: { filesize: 5 * 1024 * 1024, files: 3 }, //uploading allows max 3 files, not more!!!
    limits: { fileSize: 5 * 1024 * 1024 }
});
var sha256 = function (buf) {
    return crypto_1["default"].createHash('sha256').update(buf).digest('hex');
};
// console.log('upload path: ', uploadPath);
require('dotenv').config();
var PORT = process.env.PORT;
var BASE_URL = process.env.BASE_URL;
var app = express_1["default"]();
app.use(body_parser_1["default"].json());
var pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || ''),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});
var init = function () {
    return new Promise(function (resolve, reject) {
        pool
            .connect()
            .then(function () { return resolve(true); })["catch"](function () { return reject(); });
    });
};
app.get("/users", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var users, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.query("\n            SELECT * FROM users;\n            ")];
            case 1:
                users = (_a.sent()).rows;
                res.status(200).json({ users: users });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(400).send(error_1.message);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/user", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var username, users, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                username = req.query.username;
                return [4 /*yield*/, pool.query("\n            SELECT * FROM users WHERE username = $1;\n            ", [username])];
            case 1:
                users = (_a.sent()).rows;
                if (users.length === 0)
                    throw new Error("SUCH USER DAES NOT EXIST");
                res.status(200).json({ user: users[0] });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(400).send(error_2.message);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post("/user", upload.single('avatar'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var username, users, pathForDB, tmpPath, buf, hash, fileName, finalPath, pathForDB_1, createdUser, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                username = req.body.username;
                res.status(200).send(true);
                return [4 /*yield*/, pool.query("\n            SELECT * FROM users WHERE username = $1;\n            ", [username])];
            case 1:
                users = (_a.sent()).rows;
                if (users.length > 0)
                    throw new Error("SUCH USERNAME IS TAKEN");
                pathForDB = null;
                if (!req.file) return [3 /*break*/, 5];
                tmpPath = req.file.path;
                return [4 /*yield*/, promises_1["default"].readFile(tmpPath)];
            case 2:
                buf = _a.sent();
                hash = sha256(buf);
                fileName = "user_" + username + "_" + hash + ".webp";
                finalPath = path_1["default"].join(uploadPath, fileName);
                // console.log("FINAL PATH: ", finalPath);
                return [4 /*yield*/, sharp_1["default"](buf).resize(512).webp({ quality: 95 }).toFile(finalPath)];
            case 3:
                // console.log("FINAL PATH: ", finalPath);
                _a.sent();
                return [4 /*yield*/, promises_1["default"].rm(tmpPath, { force: true })];
            case 4:
                _a.sent();
                pathForDB_1 = "/uploads/" + fileName;
                _a.label = 5;
            case 5: 
            // res.status(200).send(true);
            return [4 /*yield*/, pool.query("\n            INSERT INTO users(username, avatar) VALUES($1, $2)\n            ", [username, pathForDB])];
            case 6:
                // res.status(200).send(true);
                _a.sent();
                return [4 /*yield*/, pool.query("\n            SELECT * FROM users WHERE username = $1;\n                ", [username])];
            case 7:
                createdUser = (_a.sent()).rows;
                /* if (users.length === 0) throw new Error(`SUCH USER DAES NOT EXIST`); */
                res.status(200).json({ user: createdUser[0] });
                return [3 /*break*/, 9];
            case 8:
                error_3 = _a.sent();
                res.status(400).send(error_3.message);
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// const test = async () => {
//   const { rows } = await pool.query(`
//         SELECT * FROM messages;
//         `);
//   console.log('ROWS: ', rows);
// };
app.patch("/user", upload.single("avatar"), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var username, users, pathForDB, tmpPath, buf, hash, fileName, finalPath, pathForDB_2, updatedUsers, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                username = req.body.username;
                return [4 /*yield*/, pool.query("\n    SELECT * FROM users WHERE username = $1\n    ", [username])];
            case 1:
                users = (_a.sent()).rows;
                if (!users[0])
                    throw new Error("User not found");
                pathForDB = null;
                if (!req.file) return [3 /*break*/, 5];
                tmpPath = req.file.path;
                return [4 /*yield*/, promises_1["default"].readFile(tmpPath)];
            case 2:
                buf = _a.sent();
                hash = sha256(buf);
                fileName = "user_" + username + "_" + hash + ".webp";
                finalPath = path_1["default"].join(uploadPath, fileName);
                return [4 /*yield*/, sharp_1["default"](buf).resize(512).webp({ quality: 95 }).toFile(finalPath)];
            case 3:
                _a.sent();
                return [4 /*yield*/, promises_1["default"].rm(tmpPath, { force: true })];
            case 4:
                _a.sent();
                pathForDB_2 = "/uploads/" + fileName;
                _a.label = 5;
            case 5:
                console.log('pathForDB :', pathForDB);
                return [4 /*yield*/, pool.query("\n          UPDATE users SET avatar = $1 WHERE username = $2;\n        ", [pathForDB, username])];
            case 6:
                _a.sent();
                return [4 /*yield*/, pool.query("\n          SELECT * FROM users WHERE username = $1;\n        ", [username])];
            case 7:
                updatedUsers = (_a.sent()).rows;
                console.log('updatedUsers: ', updatedUsers);
                res.status(200).json({ user: updatedUsers[0] });
                return [3 /*break*/, 9];
            case 8:
                error_4 = _a.sent();
                res.status(400).send(error_4.message);
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
app.get('/messages', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var messages, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.query("\n      SELECT messages.uuid AS uuid,\nmessages.content AS content,\n// messages.created_at AS created_at,\nmessages.updated_at AS updated_at,\nusers.username AS username,\nusers.avatar AS avatar,\nCASE WHEN messages.created_at = messages.updated_at THEN 'false' ELSE 'true' END AS was_edited\nFROM messages LEFT JOIN users ON users.uuid = messages.author_uuid;\n      ")];
            case 1:
                messages = (_a.sent()).rows;
                res.status(200).json({ messages: messages });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                res.status(400).send(error_5.message);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post("/message", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, content, username, users, messages, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, content = _a.content, username = _a.username;
                // Validacija chto takoj polzovatel est. 73-135 stroki dlja app.post(`/user` kak primer
                //Validacija chto est kontent, chto nikto ne prishljot soobwenije s pustoj strochkoj
                if (!content)
                    throw new Error("No content provided");
                return [4 /*yield*/, pool.query("\n          SELECT * FROM users WHERE username=$1\n        ", [username])];
            case 1:
                users = (_b.sent()).rows;
                return [4 /*yield*/, pool.query("\n      INSERT INTO messages(content, author_uuid) VALUES($1, $2)\n      ", [content, users[0].uuid])];
            case 2:
                _b.sent();
                return [4 /*yield*/, pool.query("\n      SELECT * FROM messages WHERE author_uuid = 'e5842e20-f135-46a7-9046-87d760144aab'  ORDER BY created_at DESC;  \n      ")];
            case 3:
                messages = (_b.sent()).rows;
                res.status(200).json({ message: messages[0] });
                return [3 /*break*/, 5];
            case 4:
                error_6 = _b.sent();
                res.status(400).send(error_6.message);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
init().then(function () {
    app.listen(PORT, function () {
        // test();
        console.log('APP IS RUNNING ON PORT: ' + PORT);
    });
});
