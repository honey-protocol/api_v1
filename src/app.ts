// app instance for our testing suite
import express from 'express';
import { initProgram } from './helpers';
require('dotenv').config();
import { router } from './routes/index';
// TODO: add middleware security | 
const app = express();

// init router
app.use('/', router);

export { app }