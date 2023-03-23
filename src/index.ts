require('dotenv').config();
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cors from 'cors';
import { initProgram } from './helpers';
import { router } from './routes/index';
import { connectDB } from './db/index';

// connect db
connectDB();
// port either from env. or default to 1337
const PORT = process.env.PORT || 1337;
const app = express();
// parse request.body as JSON
app.use(express.json());
// sanitize requests | not allowing queries as requests
app.use(mongoSanitize());
// sets various security HTTP headers || sniffing / DNS prefetch etc.
app.use(helmet());
// prevent XSS attacks
app.use(xss());
// config rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes 100 request
  max: 100
});
// init rate limit
app.use(limiter);
// prevent http param pollution
app.use(hpp());
// cors config for when wanting to only allow beta
// const corsOptions = {
//   origin: 'https://beta.honey.finance/',
//   optionsSuccessStatus: 200
// }
// init cors
// app.use(cors(corsOptions));
// init router
app.use('/', router);
// inits program - 
initProgram();
// init server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port: ${PORT}`)
});

