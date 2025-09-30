import express from 'express';
import bodyParser from 'body-parser';
import { Pool } from 'pg';

require('dotenv').config();
const PORT = process.env.PORT;

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

app.post(`/user`, async (req, res) => {
  // console.log("BODY: ", req.body);
  // res.status(200).send(true);
  try {
    const { username } = req.body;

    const { rows: users } = await pool.query(
      `
            SELECT * FROM users WHERE username = $1;
            `,
      [username]
    );

    if (users.length > 0) throw new Error(`SUCH USERNAME IS TAKEN`);

    await pool.query(
      `
            INSERT INTO users(username) VALUES($1)
            `,
      [username]
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
