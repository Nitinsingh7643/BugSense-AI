import express from 'express';
import { QueryHistory } from '../models/QueryHistory.js';
import { validateObjectId } from '../middleware/validate.js';

const router = express.Router();

/**
 * 1. READ (R) - Get recent student debugging history
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit = 30, resolved } = req.query;
    const filter = {};
    if (resolved !== undefined) {
      filter.resolved = resolved === 'true';
    }

    const history = await QueryHistory.find(filter)
      .populate('matchedErrorCaseId', 'errorMessage errorType language helpfulVotes timesSolved suggestedFix severity category')
      .sort({ createdAt: -1 })
      .limit(Math.min(100, parseInt(limit, 10) || 30))
      .lean();

    res.json({ success: true, count: history.length, history });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. READ (R) - Get single history item by ID
 */
router.get('/:id', validateObjectId('id'), async (req, res, next) => {
  try {
    const item = await QueryHistory.findById(req.params.id)
      .populate('matchedErrorCaseId')
      .lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        error: `History record '${req.params.id}' not found in MongoDB.`
      });
    }

    res.json({ success: true, history: item });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. CREATE (C) - Create a new history log entry manually
 */
router.post('/', async (req, res, next) => {
  try {
    const { queryText, codeSnippet = '', language = 'auto', actionTaken = 'requested_ai_explanation', resolved = false } = req.body;

    if (!queryText || typeof queryText !== 'string' || queryText.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: queryText is required and must be at least 2 characters.'
      });
    }

    const newHistory = await QueryHistory.create({
      queryText: queryText.trim(),
      codeSnippet: codeSnippet.trim(),
      language: language.toLowerCase().trim(),
      actionTaken,
      resolved: Boolean(resolved)
    });

    res.status(201).json({
      success: true,
      message: 'Query history record created in MongoDB (POST)!',
      history: newHistory
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. UPDATE (U) - Update history item (toggle resolved or edit details)
 */
router.patch('/:id', validateObjectId('id'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolved, actionTaken } = req.body;

    const item = await QueryHistory.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'History record not found in MongoDB.'
      });
    }

    if (resolved !== undefined) {
      item.resolved = Boolean(resolved);
    }
    if (actionTaken !== undefined) {
      item.actionTaken = actionTaken;
    }

    await item.save();

    res.json({
      success: true,
      message: 'History item updated successfully in MongoDB (PATCH)!',
      history: item
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. DELETE (D) - Delete single history item
 */
router.delete('/:id', validateObjectId('id'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await QueryHistory.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'History item not found in MongoDB.'
      });
    }

    res.json({
      success: true,
      message: 'History record deleted successfully from MongoDB (DELETE)!',
      deletedId: id
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 6. DELETE (D) - Clear all history records
 */
router.delete('/', async (req, res, next) => {
  try {
    const result = await QueryHistory.deleteMany({});
    res.json({
      success: true,
      message: `Debugging history cleared successfully (${result.deletedCount} items deleted).`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
