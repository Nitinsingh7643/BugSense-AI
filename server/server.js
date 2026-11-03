import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import errorsRouter from './routes/errors.js';
import historyRouter from './routes/history.js';
import analyticsRouter from './routes/analytics.js';
import statusRouter from './routes/status.js';
import authRouter from './routes/auth.js';
import { seedDatabase } from './services/seedData.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json({ limit: '10mb' }));

// Router for all API endpoints
const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BugSense AI Backend', timestamp: new Date() });
});

apiRouter.use('/errors', errorsRouter);
apiRouter.use('/history', historyRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/status', statusRouter);
apiRouter.use('/auth', authRouter);

// Mount router on both '/api' and '/' to ensure full compatibility with Vercel rewrites & standalone Node
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Centralized Error Handler (handles Mongoose ValidationError, CastError, and HTTP errors)
app.use(errorHandler);

// Start server and connect to MongoDB in standalone mode
async function startServer() {
  try {
    console.log('[Server] Connecting to MongoDB...');
    await connectDB();
    
    // Auto-seed initial errors, feedback, and history if database is fresh
    await seedDatabase(false);

    app.listen(PORT, () => {
      console.log(`[BugSense AI] Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Fatal initialization error:', error.message);
    process.exit(1);
  }
}

// Auto-start server in standalone Node environment (skipped in Vercel serverless)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
