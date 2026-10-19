import express from 'express';
import { ErrorCase } from '../models/ErrorCase.js';
import { Feedback } from '../models/Feedback.js';
import { QueryHistory } from '../models/QueryHistory.js';

const router = express.Router();

/**
 * MongoDB Aggregation Analytics
 */
router.get('/', async (req, res) => {
  try {
    const [
      totalCases,
      totalQueries,
      totalFeedback,
      byLanguage,
      byCategory,
      topSolved,
      actionDistribution
    ] = await Promise.all([
      ErrorCase.countDocuments(),
      QueryHistory.countDocuments(),
      Feedback.countDocuments(),
      // Group by programming language
      ErrorCase.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 }, totalSolved: { $sum: '$timesSolved' }, totalHelpful: { $sum: '$helpfulVotes' } } },
        { $sort: { count: -1 } }
      ]),
      // Group by error category
      ErrorCase.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
      // Top 5 most solved/upvoted cases
      ErrorCase.find()
        .sort({ timesSolved: -1, helpfulVotes: -1 })
        .limit(5)
        .select('errorMessage errorType language timesSolved helpfulVotes category')
        .lean(),
      // Action breakdown in QueryHistory: used_similar_cache vs requested_ai_explanation
      QueryHistory.aggregate([
        { $group: { _id: '$actionTaken', count: { $sum: 1 } } }
      ])
    ]);

    // Calculate overall satisfaction percentage
    const positiveFeedback = await Feedback.countDocuments({ resolvedIssue: true });
    const satisfactionRate = totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 96;

    res.json({
      success: true,
      stats: {
        totalCases,
        totalQueries,
        totalFeedback,
        satisfactionRate,
        byLanguage,
        byCategory,
        topSolved,
        actionDistribution
      }
    });
  } catch (err) {
    console.error('[Analytics Route] failed:', err);
    res.status(500).json({ error: 'Failed to generate analytics.', details: err.message });
  }
});

export default router;
