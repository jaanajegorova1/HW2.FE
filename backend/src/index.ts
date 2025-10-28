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
      //.then(() => resolve(true))
      .then(async () => {
        async function initDB() {
          // 1) расширения
          await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
          await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

          // 2) если uuid_generate_v4() нет — создаём совместимую обёртку на gen_random_uuid()
          await pool.query(`
				  DO $DO$
				  BEGIN
				    IF NOT EXISTS (
				      SELECT 1
				      FROM pg_proc p
				      JOIN pg_namespace n ON n.oid = p.pronamespace
				      WHERE p.proname = 'uuid_generate_v4'
				        AND n.nspname = 'public'
				        AND pg_get_function_identity_arguments(p.oid) = ''
				    ) THEN
				      CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
				      RETURNS uuid
				      LANGUAGE sql
				      IMMUTABLE
				      AS $f$ SELECT gen_random_uuid(); $f$;
				    END IF;
				  END
				  $DO$;
				`);

          // 3) таблицы
          await pool.query(`
				  CREATE TABLE IF NOT EXISTS public.users (
				    uuid        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
				    username    varchar(15) NOT NULL UNIQUE,
				    created_at  timestamptz  NOT NULL DEFAULT now(),
				    updated_at  timestamptz  NOT NULL DEFAULT now(),
				    avatar      varchar(255)
				  );
				`);

          await pool.query(`
				  CREATE TABLE IF NOT EXISTS public.messages (
				    uuid         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
				    content      text        NOT NULL,
				    author_uuid  uuid        NULL,
				    created_at   timestamptz NOT NULL DEFAULT now(),
				    updated_at   timestamptz NOT NULL DEFAULT now()
				  );
				`);

          // 4) FK если ещё нет
          await pool.query(`
				  DO $DO$
				  BEGIN
				    IF NOT EXISTS (
				      SELECT 1
				      FROM pg_constraint
				      WHERE conname = 'messages_author_uuid_fkey'
				    ) THEN
				      ALTER TABLE public.messages
				        ADD CONSTRAINT messages_author_uuid_fkey
				        FOREIGN KEY (author_uuid) REFERENCES public.users (uuid);
				    END IF;
				  END
				  $DO$;
				`);

          // 5) функция + триггеры updated_at
          await pool.query(`
				  CREATE OR REPLACE FUNCTION public.set_updated_at()
				  RETURNS trigger
				  LANGUAGE plpgsql
				  AS $fn$
				  BEGIN
				    NEW.updated_at := now();
				    RETURN NEW;
				  END
				  $fn$;
				`);

          await pool.query(
            `DROP TRIGGER IF EXISTS set_users_updated_at    ON public.users;`
          );
          await pool.query(
            `DROP TRIGGER IF EXISTS set_messages_updated_at ON public.messages;`
          );

          await pool.query(`
				  CREATE TRIGGER set_users_updated_at
				  BEFORE UPDATE ON public.users
				  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
				`);

          await pool.query(`
				  CREATE TRIGGER set_messages_updated_at
				  BEFORE UPDATE ON public.messages
				  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
				`);
        }

        await initDB();

        return resolve(true);
      })
      .catch((error) => reject(error));
  });
};

app.get(`/users`, async (req, res) => {
  try {
    const { rows: users } = await pool.query(`
            SELECT * FROM users;
            `);
    const usersWithAbsoluteAvatarPath = users.map((user) => ({
      ...user,
      avatar: user.avatar ? `${BASE_URL}${user.avatar}` : null,
    }));
    // res.status(200).json({ users });
    res.status(200).json({ usersWithAbsoluteAvatarPath });
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

    if (users.length === 0) throw new Error(`SUCH USER DOES NOT EXIST`);

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
    // res.status(200).send(true);

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

      pathForDB = `/uploads/${fileName}`; //esli pathForDB not null, to on pereopredelitsja
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

app.get("/health", (_req, res) => res.status(200).send("ok"));

init()
.then(() => {
  app.listen(PORT, () => {
    // test();
    console.log('APP IS RUNNING ON PORT: ' + PORT);
  });
})
 .catch((error) => console.log("ERROR: ", error));
