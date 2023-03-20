import mongoose from 'mongoose';
require('dotenv').config();

const connectDB = async () => {
  mongoose.connect(process.env.DB_CONNECTION_STRING)
  .then(() => {
    console.log('DBconnection established')
  })
  .catch((error) => {
    console.log(`An error occurred establishing a DBconnection: ${error}`);
    return;
  })
}

export { connectDB };