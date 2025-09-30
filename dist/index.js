"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
require('dotenv').config();
const app = (0, express_1.default)();
const PORT = process.env.PORT;
app.use(body_parser_1.default.json());
app.listen(PORT, () => {
    console.log('APP IS RUNNING ON PORT: ' + PORT);
});
