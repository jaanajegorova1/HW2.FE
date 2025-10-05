import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import crypto from 'crypto';
import multer from 'multer';
import { Pool } from 'pg';

const uploadPath = path.join(process.cwd(), 'uploads');
const upload = multer({
  dest: uploadPath,
  // limits: { filesize: 5 * 1024 * 1024, files: 3 }, //uploading allows max 3 files, not more!!!
  limits: { fileSize: 5 * 1024 * 1024 },
});

const sha256 = (buf: Buffer) =>
  crypto.createHash('sha256').update(buf).digest('hex');
// console.log('upload path: ', uploadPath);

require('dotenv').config();
const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;
const app = express();
app.use(bodyParser.json());

const pool = new Pool({
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

app.get(`/users`, async (req, res) => {
  try {
    const { rows: users } = await pool.query(`
            SELECT * FROM users;
            `);
    res.status(200).json({ users });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

app.get(`/user`, async (req, res) => {
  try {
    const { username } = req.query;
    const { rows: users } = await pool.query(
      `
            SELECT * FROM users WHERE username = $1;
            `,
      [username]
    );

    if (users.length === 0) throw new Error(`SUCH USER DAES NOT EXIST`);

    res.status(200).json({ user: users[0] });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

app.post(`/user`, upload.single('avatar'), async (req, res) => {
  // console.log("BODY: ", req.body);
  // res.status(200).send(true);
  try {
    const { username } = req.body;
    res.status(200).send(true);

    const { rows: users } = await pool.query(
      `
            SELECT * FROM users WHERE username = $1;
            `,
      [username]
    );

    if (users.length > 0) throw new Error(`SUCH USERNAME IS TAKEN`);

    //if (!req.file) throw new Error("AVATAR IS REQUIRED");   //eto esli avatar objazatelen

    let pathForDB = null; //if user created without avatar

    if (req.file) {
      const { path: tmpPath } = req.file;

      const buf = await fs.readFile(tmpPath);
      // console.log('BUF: ', buf);
      const hash = sha256(buf);
      // console.log("HASH: ", hash);
      const fileName = `user_${username}_${hash}.webp`;
      // console.log("FILE NAME: ", fileName);
      const finalPath = path.join(uploadPath, fileName);
      // console.log("FINAL PATH: ", finalPath);

      await sharp(buf).resize(512).webp({ quality: 95 }).toFile(finalPath);
      await fs.rm(tmpPath, { force: true });

      const pathForDB = `/uploads/${fileName}`; //esli pathForDB not null, to on pereopredelitsja
      // console.log("pathForDB: ", pathForDB);
    }

    // res.status(200).send(true);
    await pool.query(
      `
            INSERT INTO users(username, avatar) VALUES($1, $2)
            `,
      [username, pathForDB]
    );

    const { rows: createdUser } = await pool.query(
      `
            SELECT * FROM users WHERE username = $1;
                `,
      [username]
    );

    /* if (users.length === 0) throw new Error(`SUCH USER DAES NOT EXIST`); */

    res.status(200).json({ user: createdUser[0] });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

// const test = async () => {
//   const { rows } = await pool.query(`
//         SELECT * FROM messages;
//         `);
//   console.log('ROWS: ', rows);
// };

app.patch(`/user`, upload.single(`avatar`), async (req, res) => {
  try {
    const { username } = req.body;

    const { rows: users } = await pool.query(
      `
    SELECT * FROM users WHERE username = $1
    `,
      [username]
    );

    if (!users[0]) throw new Error(`User not found`);
    let pathForDB = null;

    if (req.file) {
      const { path: tmpPath } = req.file;
      const buf = await fs.readFile(tmpPath);
      const hash = sha256(buf);
      const fileName = `user_${username}_${hash}.webp`;
      const finalPath = path.join(uploadPath, fileName);
      await sharp(buf).resize(512).webp({ quality: 95 }).toFile(finalPath);
      await fs.rm(tmpPath, { force: true });
      const pathForDB = `/uploads/${fileName}`;
    }

    console.log('pathForDB :', pathForDB);

    await pool.query(
      `
          UPDATE users SET avatar = $1 WHERE username = $2;
        `,
      [pathForDB, username]
    );

    const { rows: updatedUsers } = await pool.query(
      `
          SELECT * FROM users WHERE username = $1;
        `,
      [username]
    );

    console.log('updatedUsers: ', updatedUsers);

    res.status(200).json({ user: updatedUsers[0] });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

app.get('/messages', async (req, res) => {
  try {
    const { rows: messages } = await pool.query(`
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
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

app.post(`/message`, async (req, res) => {
  try {
    const { content, username } = req.body;

    // Validacija chto takoj polzovatel est. 73-135 stroki dlja app.post(`/user` kak primer

    //Validacija chto est kontent, chto nikto ne prishljot soobwenije s pustoj strochkoj
    if (!content) throw new Error(`No content provided`);

    const { rows: users } = await pool.query(
      `
          SELECT * FROM users WHERE username=$1
        `,
      [username]
    );

    await pool.query(
      `
      INSERT INTO messages(content, author_uuid) VALUES($1, $2)
      `,
      [content, users[0].uuid]
    );

    const { rows: messages } = await pool.query(`
      SELECT * FROM messages WHERE author_uuid = 'e5842e20-f135-46a7-9046-87d760144aab'  ORDER BY created_at DESC;  
      `);
    res.status(200).json({ message: messages[0] });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

init().then(() => {
  app.listen(PORT, () => {
    // test();
    console.log('APP IS RUNNING ON PORT: ' + PORT);
  });
});
