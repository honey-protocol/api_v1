import express from 'express';
import { initProgram } from './helpers';
require('dotenv').config();
import { router } from './routes/index';

// TODO: add middleware security | 

// port either from env. or default to 1337
const PORT = process.env.PORT || 1337;
const app = express();

// init router
app.use('/', router);

initProgram()

// init server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port: ${PORT}`)
});

