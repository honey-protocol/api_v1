require('dotenv').config();
import express from 'express';
import { initProgram } from './helpers';
import { router } from './routes/index';
import { connectDB } from './db/index';


// TODO: add middleware security | 
// connect db
connectDB();
// port either from env. or default to 1337
const PORT = process.env.PORT || 1337;
const app = express();
// parse request.body as JSON
app.use(express.json())
// init router
app.use('/', router);
// inits program - 
initProgram();
// init server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port: ${PORT}`)
});

