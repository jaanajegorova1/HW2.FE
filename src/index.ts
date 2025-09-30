import express from 'express';
import bodyParser from 'body-parser';

require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());

app.listen(PORT, () => {
  console.log('APP IS RUNNING ON PORT: ' + PORT);
});
