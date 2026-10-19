import express from 'express';
import mongoose from 'mongoose';
import { ErrorCase } from '../models/ErrorCase.js';
import { Feedback } from '../models/Feedback.js';
import { QueryHistory } from '../models/QueryHistory.js';
import { seedDatabase } from '../services/seedData.js';

const router = express.Router();

/**
 * Health check and live MongoDB statistics
 */
router.get('/', async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    let dbStats = null;
    let counts = { errorCases: 0, feedback: 0, history: 0 };
    let indexes = [];

    if (isConnected) {
      const db = mongoose.connection.db;
      dbStats = await db.stats();
      
      const [c1, c2, c3] = await Promise.all([
        ErrorCase.countDocuments(),
        Feedback.countDocuments(),
        QueryHistory.countDocuments()
      ]);
      counts = { errorCases: c1, feedback: c2, history: c3 };

      try {
        indexes = await ErrorCase.collection.indexes();
      } catch (idxErr) {
        indexes = [{ name: 'standard_indexes_loaded' }];
      }
    }

    res.json({
      success: true,
      mongo: {
        connected: isConnected,
        host: mongoose.connection.host || '127.0.0.1',
        port: mongoose.connection.port || 27017,
        databaseName: mongoose.connection.name || 'bugsense_ai',
        readyState: mongoose.connection.readyState,
        collections: counts,
        indexesCount: indexes.length,
        dataSize: dbStats ? `${(dbStats.dataSize / 1024).toFixed(2)} KB` : 'N/A',
        storageSize: dbStats ? `${(dbStats.storageSize / 1024).toFixed(2)} KB` : 'N/A'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to inspect MongoDB status.', details: err.message });
  }
});

/**
 * Trigger manual database re-seed
 */
router.post('/seed', async (req, res) => {
  try {
    const force = req.body?.force === true;
    const result = await seedDatabase(force);
    res.json({
      success: true,
      message: `Database seeded successfully with ${result.count} error cases.`,
      result
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed database.', details: err.message });
  }
});

export default router;
