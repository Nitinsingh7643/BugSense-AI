import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import errorsRouter from './routes/errors.js';
import historyRouter from './routes/history.js';
import analyticsRouter from './routes/analytics.js';
import statusRouter from './routes/status.js';
import { seedDatabase } from './services/seedData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'BugSense AI Backend', timestamp: new Date() });
});

// Mount Routes
app.use('/api/errors', errorsRouter);
app.use('/api/history', historyRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/status', statusRouter);

// Start server and connect to MongoDB
async function startServer() {
  try {
    console.log('[Server] Connecting to MongoDB...');
    await connectDB();
    
    // Auto-seed initial errors if database is fresh
    await seedDatabase(false);

    app.listen(PORT, () => {
      console.log(`[BugSense AI] Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Fatal initialization error:', error.message);
    process.exit(1);
  }
}

startServer();
