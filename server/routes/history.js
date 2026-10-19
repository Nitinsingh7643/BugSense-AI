import express from 'express';
import { QueryHistory } from '../models/QueryHistory.js';

const router = express.Router();

/**
 * Get recent student debugging history
 */
router.get('/', async (req, res) => {
  try {
    const history = await QueryHistory.find()
      .populate('matchedErrorCaseId', 'errorMessage errorType language helpfulVotes timesSolved suggestedFix')
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch debugging history.', details: err.message });
  }
});

/**
 * Update history item (toggle resolved or edit details)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolved } = req.body;

    const item = await QueryHistory.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'History record not found in MongoDB.' });
    }

    if (resolved !== undefined) {
      item.resolved = Boolean(resolved);
    }

    await item.save();

    res.json({
      success: true,
      message: 'History item updated successfully!',
      history: item
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update history item.', details: err.message });
  }
});

/**
 * Delete single history item
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await QueryHistory.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'History item not found in MongoDB.' });
    }

    res.json({
      success: true,
      message: 'History record deleted successfully!',
      deletedId: id
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete history item.', details: err.message });
  }
});

/**
 * Clear all history
 */
router.delete('/', async (req, res) => {
  try {
    await QueryHistory.deleteMany({});
    res.json({ success: true, message: 'Debugging history cleared.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear history.', details: err.message });
  }
});

export default router;
