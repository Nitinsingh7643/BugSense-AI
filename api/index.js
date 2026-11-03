import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../server/config/db.js';
import app from '../server/server.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Serverless] MongoDB connection error:', err.message);
  }

  return app(req, res);
}
