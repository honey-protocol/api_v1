import express from 'express';
require('dotenv').config();
import { router } from './routes/index';

// port either from env. or default to 1337
const PORT = process.env.PORT || 1337;
const app = express();

// set router
app.use('/', router);

// init server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port: ${PORT}`)
});

