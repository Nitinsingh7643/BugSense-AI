import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export async function connectDB() {
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugsense_ai';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error:`, error.message);
    throw error;
  }
}
