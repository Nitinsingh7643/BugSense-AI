import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { seedDatabase } from '../services/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runSeed() {
  try {
    console.log('[Seed Script] Connecting to MongoDB...');
    await connectDB();
    console.log('[Seed Script] Seeding database with fresh error cases...');
    const res = await seedDatabase(true);
    console.log(`[Seed Script] Successfully seeded ${res.count} error cases into MongoDB!`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Script] Seeding failed:', err.message);
    process.exit(1);
  }
}

runSeed();
