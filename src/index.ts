import express from 'express';
require('dotenv').config()

console.log('@@-- ', process.env.NODE_ENV)
const PORT = process.env.PORT || 1337;


const app = express();

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port: ${PORT}`)
})