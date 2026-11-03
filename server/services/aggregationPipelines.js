import { ErrorCase } from '../models/ErrorCase.js';
import { Feedback } from '../models/Feedback.js';
import { QueryHistory } from '../models/QueryHistory.js';

/**
 * Pipeline 1: Language Breakdown with Computed Resolution Rates ($group + $project + $sort)
 */
export const languageStatsPipelineDefinition = [
  {
    $group: {
      _id: '$language',
      count: { $sum: 1 },
      totalSolved: { $sum: '$timesSolved' },
      totalQueries: { $sum: '$timesQueried' },
      avgHelpfulVotes: { $avg: '$helpfulVotes' },
      distinctErrorTypes: { $addToSet: '$errorType' }
    }
  },
  {
    $project: {
      _id: 0,
      language: '$_id',
      count: 1,
      totalSolved: 1,
      totalQueries: 1,
      avgHelpfulVotes: { $round: ['$avgHelpfulVotes', 1] },
      uniqueErrorTypesCount: { $size: '$distinctErrorTypes' },
      resolutionRatePercent: {
        $round: [
          {
            $multiply: [
              {
                $divide: [
                  '$totalSolved',
                  { $cond: [{ $eq: ['$totalQueries', 0] }, 1, '$totalQueries'] }
                ]
              },
              100
            ]
          },
          1
        ]
      }
    }
  },
  { $sort: { count: -1, totalSolved: -1 } }
];

/**
 * Pipeline 2: Tag Cloud Frequency Pipeline ($unwind + $group + $sort + $limit + $project)
 */
export const tagFrequencyPipelineDefinition = [
  { $unwind: '$tags' },
  { $match: { tags: { $nin: [null, ''] } } },
  {
    $group: {
      _id: '$tags',
      count: { $sum: 1 },
      languages: { $addToSet: '$language' },
      avgHelpful: { $avg: '$helpfulVotes' }
    }
  },
  { $sort: { count: -1, avgHelpful: -1 } },
  { $limit: 25 },
  {
    $project: {
      _id: 0,
      tag: '$_id',
      count: 1,
      languages: 1,
      avgHelpful: { $round: ['$avgHelpful', 1] }
    }
  }
];

/**
 * Pipeline 3: Relational Multi-Collection Join ($lookup from feedbacks + $project)
 */
export const feedbackLookupPipelineDefinition = [
  {
    $lookup: {
      from: 'feedbacks',
      localField: '_id',
      foreignField: 'errorCaseId',
      as: 'feedbackList'
    }
  },
  {
    $project: {
      errorMessage: 1,
      language: 1,
      category: 1,
      severity: 1,
      timesSolved: 1,
      helpfulVotes: 1,
      feedbackCount: { $size: '$feedbackList' },
      avgRating: {
        $cond: [
          { $gt: [{ $size: '$feedbackList' }, 0] },
          { $round: [{ $avg: '$feedbackList.rating' }, 1] },
          5.0
        ]
      },
      resolvedFeedbackCount: {
        $size: {
          $filter: {
            input: '$feedbackList',
            as: 'fb',
            cond: { $eq: ['$$fb.resolvedIssue', true] }
          }
        }
      }
    }
  },
  { $sort: { feedbackCount: -1, helpfulVotes: -1 } },
  { $limit: 10 }
];

/**
 * Pipeline 4: Multi-Faceted Pipeline ($facet - running multiple pipelines in parallel)
 */
export const multiFacetPipelineDefinition = [
  {
    $facet: {
      severityDistribution: [
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
            avgHelpful: { $avg: '$helpfulVotes' }
          }
        },
        { $sort: { count: -1 } }
      ],
      categoryDistribution: [
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ],
      summaryMetrics: [
        {
          $group: {
            _id: null,
            totalCases: { $sum: 1 },
            totalQueries: { $sum: '$timesQueried' },
            totalSolved: { $sum: '$timesSolved' },
            totalHelpful: { $sum: '$helpfulVotes' },
            avgQueriesPerCase: { $avg: '$timesQueried' }
          }
        },
        {
          $project: {
            _id: 0,
            totalCases: 1,
            totalQueries: 1,
            totalSolved: 1,
            totalHelpful: 1,
            avgQueriesPerCase: { $round: ['$avgQueriesPerCase', 1] }
          }
        }
      ],
      topSolvedLeaderboard: [
        { $sort: { timesSolved: -1, helpfulVotes: -1 } },
        { $limit: 5 },
        {
          $project: {
            errorMessage: 1,
            language: 1,
            category: 1,
            severity: 1,
            timesSolved: 1,
            helpfulVotes: 1
          }
        }
      ]
    }
  }
];

/**
 * Pipeline 5: Date Time-Series Aggregation on QueryHistory ($dateToString + $group + $sort)
 */
export const dailyTrendPipelineDefinition = [
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      totalQueries: { $sum: 1 },
      resolvedCount: { $sum: { $cond: ['$resolved', 1, 0] } },
      usedCacheCount: {
        $sum: { $cond: [{ $eq: ['$actionTaken', 'used_similar_cache'] }, 1, 0] }
      },
      requestedAICount: {
        $sum: { $cond: [{ $eq: ['$actionTaken', 'requested_ai_explanation'] }, 1, 0] }
      }
    }
  },
  {
    $project: {
      _id: 0,
      date: '$_id',
      totalQueries: 1,
      resolvedCount: 1,
      usedCacheCount: 1,
      requestedAICount: 1,
      resolutionRatePercent: {
        $round: [
          {
            $multiply: [
              {
                $divide: [
                  '$resolvedCount',
                  { $cond: [{ $eq: ['$totalQueries', 0] }, 1, '$totalQueries'] }
                ]
              },
              100
            ]
          },
          1
        ]
      }
    }
  },
  { $sort: { date: 1 } },
  { $limit: 14 }
];

/**
 * Named catalog of all MongoDB Aggregation Pipelines with descriptions for API and UI Inspector
 */
export const PIPELINES_CATALOG = {
  languageStats: {
    id: 'languageStats',
    name: 'Language Performance & Resolution Rate',
    collection: 'ErrorCase',
    stagesUsed: ['$group', '$project', '$sort', '$round', '$divide', '$addToSet'],
    description: 'Groups error cases by programming language, accumulates solved and query counts, and computes real-time percentage resolution rates using $divide and $multiply math operators.',
    pipeline: languageStatsPipelineDefinition,
    executor: () => ErrorCase.aggregate(languageStatsPipelineDefinition)
  },
  tagFrequency: {
    id: 'tagFrequency',
    name: 'Tag Cloud Frequency Aggregation',
    collection: 'ErrorCase',
    stagesUsed: ['$unwind', '$match', '$group', '$sort', '$limit', '$project'],
    description: 'Flattens the embedded tags array using $unwind, groups by unique tag, counts occurrences, collects distinct associated languages ($addToSet), and sorts the top 25 developer tags.',
    pipeline: tagFrequencyPipelineDefinition,
    executor: () => ErrorCase.aggregate(tagFrequencyPipelineDefinition)
  },
  feedbackLookup: {
    id: 'feedbackLookup',
    name: 'Cross-Collection Relational Join',
    collection: 'ErrorCase & Feedback',
    stagesUsed: ['$lookup', '$project', '$sort', '$limit', '$filter', '$avg'],
    description: 'Performs a left outer join between ErrorCase and Feedback documents using $lookup. Computes real-time average student star ratings and filtered resolution counts without application-side joins.',
    pipeline: feedbackLookupPipelineDefinition,
    executor: () => ErrorCase.aggregate(feedbackLookupPipelineDefinition)
  },
  multiFacet: {
    id: 'multiFacet',
    name: 'Multi-Faceted Dashboard Aggregation',
    collection: 'ErrorCase',
    stagesUsed: ['$facet', '$group', '$sort', '$limit', '$project'],
    description: 'Executes 4 independent aggregation pipelines simultaneously within a single $facet stage on the same document stream: severity distribution, category breakdown, overall KPI metrics, and top leaderboard.',
    pipeline: multiFacetPipelineDefinition,
    executor: () => ErrorCase.aggregate(multiFacetPipelineDefinition)
  },
  dailyTrends: {
    id: 'dailyTrends',
    name: 'Daily Query Trends & Time-Series',
    collection: 'QueryHistory',
    stagesUsed: ['$group', '$dateToString', '$project', '$sort', '$limit'],
    description: 'Formats ISO timestamp dates into YYYY-MM-DD strings using $dateToString, groups daily student queries, and aggregates cache hit versus AI generation ratios.',
    pipeline: dailyTrendPipelineDefinition,
    executor: () => QueryHistory.aggregate(dailyTrendPipelineDefinition)
  }
};
