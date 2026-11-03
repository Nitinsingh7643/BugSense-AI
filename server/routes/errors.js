import express from 'express';
import { ErrorCase } from '../models/ErrorCase.js';
import { Feedback } from '../models/Feedback.js';
import { QueryHistory } from '../models/QueryHistory.js';
import { findSimilarSolvedErrors, generateErrorSignature, detectLanguage } from '../services/similarityService.js';
import { explainErrorWithAI } from '../services/aiService.js';
import { validateErrorCasePayload, validateFeedbackPayload, validateObjectId } from '../middleware/validate.js';

const router = express.Router();

/**
 * 1. Find previously solved similar errors before requesting a new AI explanation
 */
router.post('/search-similar', async (req, res, next) => {
  try {
    const { errorText, codeSnippet, language } = req.body;

    if (!errorText && !codeSnippet) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Please provide an error message or code snippet.'
      });
    }

    const result = await findSimilarSolvedErrors({
      errorText: errorText || '',
      codeSnippet: codeSnippet || '',
      language: language || 'auto'
    });

    res.json({
      success: true,
      count: result.matches.length,
      hasMatch: result.matches.length > 0,
      bestMatch: result.bestMatch,
      matches: result.matches,
      detectedLanguage: result.detectedLanguage
    });
  } catch (err) {
    next(err);
  }
});
/**
 * 2. Analyze error with AI, classify, and store in MongoDB
 * CRUD: CREATE (C) via intelligent analysis
 */
router.post('/analyze', async (req, res, next) => {
  try {
    const { errorText, codeSnippet, language, userApiKey, chosenSimilarId } = req.body;

    if (!errorText && !codeSnippet) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Error text or code snippet is required for analysis.'
      });
    }

    const detectedLang = (!language || language === 'auto') ? detectLanguage(errorText, codeSnippet) : language;

    // If student accepted a previously solved similar error
    if (chosenSimilarId) {
      const existing = await ErrorCase.findById(chosenSimilarId);
      if (existing) {
        existing.timesQueried += 1;
        existing.timesSolved += 1;
        await existing.save();

        await QueryHistory.create({
          queryText: errorText || existing.errorMessage,
          codeSnippet: codeSnippet || existing.codeSnippet,
          language: detectedLang,
          actionTaken: 'used_similar_cache',
          matchedErrorCaseId: existing._id,
          similarityScore: 100,
          resolved: true
        });

        return res.json({
          success: true,
          errorCase: existing,
          source: 'similar_match_reused',
          reused: true
        });
      }
    }

    // Call AI Service (Gemini or expert built-in fallback)
    const aiResult = await explainErrorWithAI({
      errorText,
      codeSnippet,
      language: detectedLang,
      userApiKey
    });

    // Normalize error and code input to guarantee schema compliance
    const cleanError = (errorText || '').trim();
    const cleanCode = (codeSnippet || '').trim();

    const effectiveRawError = cleanError || (cleanCode ? `Code diagnostic: ${cleanCode.slice(0, 300)}` : 'Diagnostic query');
    const effectiveErrorMessage = cleanError
      ? cleanError.split('\n')[0].slice(0, 200)
      : (aiResult.errorType
          ? `${aiResult.errorType}: In snippet "${cleanCode.split('\n')[0].slice(0, 80)}"`
          : `Diagnostic: ${cleanCode.split('\n')[0].slice(0, 80)}`);

    const signature = generateErrorSignature(cleanError || cleanCode, detectedLang);

    // Check if identical signature already exists in MongoDB
    let errorCase = await ErrorCase.findOne({ errorSignature: signature });

    if (errorCase) {
      // Update existing case frequency and refresh with improved analysis
      errorCase.timesQueried += 1;
      if (cleanCode && !errorCase.codeSnippet) {
        errorCase.codeSnippet = cleanCode;
      }
      if (aiResult.explanation) {
        errorCase.errorType = aiResult.errorType || errorCase.errorType;
        errorCase.category = aiResult.category || errorCase.category;
        errorCase.severity = aiResult.severity || errorCase.severity;
        errorCase.explanation = aiResult.explanation;
        errorCase.causes = aiResult.causes || errorCase.causes;
        errorCase.suggestedFix = aiResult.suggestedFix || errorCase.suggestedFix;
        errorCase.preventionTips = aiResult.preventionTips || errorCase.preventionTips;
        errorCase.tags = aiResult.tags || errorCase.tags;
        errorCase.language = detectedLang;
      }
      await errorCase.save();
    } else {
      // Store new case in MongoDB with schema validation
      errorCase = await ErrorCase.create({
        errorSignature: signature,
        rawError: effectiveRawError,
        errorMessage: effectiveErrorMessage,
        codeSnippet: cleanCode || '',
        language: detectedLang,
        errorType: aiResult.errorType || 'RuntimeError',
        category: aiResult.category || 'Runtime Error',
        severity: ['Critical', 'High', 'Medium', 'Low'].includes(aiResult.severity) ? aiResult.severity : 'Medium',
        explanation: aiResult.explanation || 'Analyzed error pattern and remedy.',
        causes: aiResult.causes || [],
        suggestedFix: aiResult.suggestedFix || {
          fixedCode: '// See verified fix instructions',
          explanation: 'Apply recommended fix.'
        },
        preventionTips: aiResult.preventionTips || [],
        tags: aiResult.tags || [detectedLang],
        source: 'ai',
        timesQueried: 1,
        timesSolved: 0
      });
    }

    // Record in student query history
    await QueryHistory.create({
      queryText: cleanError || cleanCode || 'Code Diagnostic',
      codeSnippet: cleanCode || '',
      language: detectedLang,
      actionTaken: 'requested_ai_explanation',
      matchedErrorCaseId: errorCase._id,
      similarityScore: 0,
      resolved: false
    });

    res.json({
      success: true,
      errorCase,
      source: aiResult.source,
      aiNotice: aiResult.aiNotice,
      isNew: !errorCase.isModified()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. READ (R) - List & filter solved errors in MongoDB knowledge base
 * Supports pagination, regex search, language filtering, tag filtering, severity filtering, and sorting
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 12, language, tag, severity, category, search, sortBy = 'helpful' } = req.query;

    const filter = {};
    if (language && language !== 'all') {
      filter.language = language.toLowerCase();
    }
    if (tag) {
      filter.tags = tag.toLowerCase();
    }
    if (severity && severity !== 'all') {
      filter.severity = severity;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { errorMessage: { $regex: search, $options: 'i' } },
        { errorType: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { explanation: { $regex: search, $options: 'i' } }
      ];
    }

    let sort = { helpfulVotes: -1 };
    if (sortBy === 'recent') sort = { createdAt: -1 };
    if (sortBy === 'views') sort = { timesQueried: -1 };
    if (sortBy === 'solved') sort = { timesSolved: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      ErrorCase.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      ErrorCase.countDocuments(filter)
    ]);

    res.json({
      success: true,
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. READ (R) - Get specific error case by ID
 * Validates ID, increments query counter, and embeds related feedback count
 */
router.get('/:id', validateObjectId('id'), async (req, res, next) => {
  try {
    const errorCase = await ErrorCase.findById(req.params.id);
    if (!errorCase) {
      return res.status(404).json({
        success: false,
        error: `Error case with ID '${req.params.id}' not found in MongoDB.`
      });
    }

    // Increment query/view count
    errorCase.timesQueried += 1;
    await errorCase.save();

    // Fetch related feedback documents
    const feedbacks = await Feedback.find({ errorCaseId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      errorCase,
      feedbacks
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. CREATE (C) - Manually create a new Error Case / Solution in MongoDB
 * Enforces strict input validation middleware before schema insertion
 */
router.post('/', validateErrorCasePayload(false), async (req, res, next) => {
  try {
    const {
      errorMessage,
      rawError,
      codeSnippet = '',
      language = 'javascript',
      errorType = 'RuntimeError',
      category = 'General Bug',
      severity = 'Medium',
      explanation,
      causes = [],
      suggestedFix,
      preventionTips = [],
      tags = []
    } = req.body;

    const raw = rawError || errorMessage;
    const lang = (language && language !== 'auto' ? language : 'javascript').toLowerCase().trim();
    const signature = generateErrorSignature(raw, lang);

    // Format suggestedFix if sent as a string or object
    const formattedFix = {
      fixedCode: typeof suggestedFix === 'string' ? suggestedFix : (suggestedFix?.fixedCode || '// Verified solution'),
      explanation: (typeof suggestedFix === 'object' && suggestedFix?.explanation) ? suggestedFix.explanation : 'Apply verified fix.',
      codeDiff: (typeof suggestedFix === 'object' && suggestedFix?.codeDiff) ? suggestedFix.codeDiff : '',
      stepByStep: (typeof suggestedFix === 'object' && Array.isArray(suggestedFix?.stepByStep)) ? suggestedFix.stepByStep : []
    };

    const parsedTags = Array.isArray(tags)
      ? tags.map(t => String(t).toLowerCase().trim()).filter(Boolean)
      : (typeof tags === 'string' ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [lang]);

    const newErrorCase = await ErrorCase.create({
      errorSignature: signature,
      rawError: raw,
      errorMessage: errorMessage.trim(),
      codeSnippet: codeSnippet.trim(),
      language: lang,
      errorType: (errorType || 'RuntimeError').trim(),
      category: (category || 'General Bug').trim(),
      severity: ['Critical', 'High', 'Medium', 'Low'].includes(severity) ? severity : 'Medium',
      explanation: explanation.trim(),
      causes: Array.isArray(causes) ? causes : [],
      suggestedFix: formattedFix,
      preventionTips: Array.isArray(preventionTips)
        ? preventionTips
        : (typeof preventionTips === 'string' ? preventionTips.split('\n').filter(Boolean) : []),
      tags: parsedTags.length > 0 ? parsedTags : [lang],
      source: 'community',
      timesQueried: 1,
      timesSolved: 1
    });

    res.status(201).json({
      success: true,
      message: 'Error c ase created successfully in MongoDB with schema validation!',
      errorCase: newErrorCase
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 6. UPDATE (U) - Complete Update of an existing Error Case by ID (PUT)
 * Enforces payload validation and updates all specified fields
 */
router.put('/:id', validateObjectId('id'), validateErrorCasePayload(true), async (req, res, next) => {
  try {
    const { id } = req.params;
    const errorCase = await ErrorCase.findById(id);

    if (!errorCase) {
      return res.status(404).json({
        success: false,
        error: `Error case with ID '${id}' not found in MongoDB.`
      });
    }

    const {
      errorMessage,
      rawError,
      codeSnippet,
      language,
      errorType,
      category,
      severity,
      explanation,
      causes,
      suggestedFix,
      preventionTips,
      tags
    } = req.body;

    if (errorMessage !== undefined) errorCase.errorMessage = errorMessage.trim();
    if (rawError !== undefined) errorCase.rawError = rawError.trim();
    if (codeSnippet !== undefined) errorCase.codeSnippet = codeSnippet.trim();
    if (language !== undefined) errorCase.language = language.toLowerCase().trim();
    if (errorType !== undefined) errorCase.errorType = errorType.trim();
    if (category !== undefined) errorCase.category = category.trim();
    if (severity !== undefined) errorCase.severity = severity;
    if (explanation !== undefined) errorCase.explanation = explanation.trim();

    if (causes !== undefined && Array.isArray(causes)) {
      errorCase.causes = causes;
    }

    if (suggestedFix !== undefined) {
      if (typeof suggestedFix === 'string') {
        errorCase.suggestedFix = {
          fixedCode: suggestedFix,
          explanation: errorCase.suggestedFix?.explanation || 'Apply verified bug fix.',
          codeDiff: errorCase.suggestedFix?.codeDiff || '',
          stepByStep: errorCase.suggestedFix?.stepByStep || []
        };
      } else if (typeof suggestedFix === 'object' && suggestedFix !== null) {
        errorCase.suggestedFix = {
          fixedCode: suggestedFix.fixedCode !== undefined ? suggestedFix.fixedCode : (errorCase.suggestedFix?.fixedCode || ''),
          explanation: suggestedFix.explanation !== undefined ? suggestedFix.explanation : (errorCase.suggestedFix?.explanation || ''),
          codeDiff: suggestedFix.codeDiff !== undefined ? suggestedFix.codeDiff : (errorCase.suggestedFix?.codeDiff || ''),
          stepByStep: suggestedFix.stepByStep !== undefined ? suggestedFix.stepByStep : (errorCase.suggestedFix?.stepByStep || [])
        };
      }
    }

    if (preventionTips !== undefined) {
      errorCase.preventionTips = Array.isArray(preventionTips)
        ? preventionTips
        : (typeof preventionTips === 'string' ? preventionTips.split('\n').filter(Boolean) : []);
    }

    if (tags !== undefined) {
      errorCase.tags = Array.isArray(tags)
        ? tags.map(t => String(t).toLowerCase().trim()).filter(Boolean)
        : (typeof tags === 'string' ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : []);
    }

    // Re-calculate signature if message or language was updated
    if (errorMessage || language || rawError) {
      errorCase.errorSignature = generateErrorSignature(
        errorCase.rawError || errorCase.errorMessage,
        errorCase.language
      );
    }

    await errorCase.save();

    res.json({
      success: true,
      message: 'Error case updated successfully in MongoDB (PUT)!',
      errorCase
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 7. UPDATE (U) - Partial Update of specific fields (PATCH)
 */
router.patch('/:id', validateObjectId('id'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const errorCase = await ErrorCase.findById(id);

    if (!errorCase) {
      return res.status(404).json({
        success: false,
        error: `Error case with ID '${id}' not found in MongoDB.`
      });
    }

    const updatableFields = [
      'errorMessage', 'rawError', 'codeSnippet', 'language',
      'errorType', 'category', 'severity', 'explanation'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        errorCase[field] = req.body[field];
      }
    });

    if (req.body.tags !== undefined) {
      errorCase.tags = Array.isArray(req.body.tags)
        ? req.body.tags.map(t => String(t).toLowerCase().trim())
        : String(req.body.tags).split(',').map(t => t.trim().toLowerCase());
    }

    await errorCase.save();

    res.json({
      success: true,
      message: 'Error case partially updated successfully in MongoDB (PATCH)!',
      errorCase
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 8. DELETE (D) - Delete an Error Case by ID with Cascading Cleanup
 */
router.delete('/:id', validateObjectId('id'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedCase = await ErrorCase.findByIdAndDelete(id);

    if (!deletedCase) {
      return res.status(404).json({
        success: false,
        error: `Error case with ID '${id}' not found in MongoDB.`
      });
    }

    // Cascading delete: clean up any associated feedback documents in MongoDB
    const feedbackDeleteResult = await Feedback.deleteMany({ errorCaseId: id });

    res.json({
      success: true,
      message: 'Error case and linked feedback deleted successfully from MongoDB (DELETE)!',
      deletedId: id,
      cascadedFeedbackDeleted: feedbackDeleteResult.deletedCount
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 9. CREATE (C) Feedback & UPDATE (U) Helpfulness
 */
router.post('/:id/feedback', validateObjectId('id'), validateFeedbackPayload, async (req, res, next) => {
  try {
    const { resolvedIssue, rating = 5, studentComment = '', studentLevel = 'Beginner' } = req.body;
    const errorCase = await ErrorCase.findById(req.params.id);

    if (!errorCase) {
      return res.status(404).json({
        success: false,
        error: 'Error case not found.'
      });
    }

    if (resolvedIssue) {
      errorCase.helpfulVotes += 1;
      errorCase.timesSolved += 1;
    } else {
      errorCase.unhelpfulVotes += 1;
    }

    await errorCase.save();

    const feedbackDoc = await Feedback.create({
      errorCaseId: errorCase._id,
      resolvedIssue: !!resolvedIssue,
      rating: Number(rating),
      studentComment,
      studentLevel
    });

    res.status(201).json({
      success: true,
      message: 'Feedback saved to MongoDB successfully!',
      helpfulVotes: errorCase.helpfulVotes,
      unhelpfulVotes: errorCase.unhelpfulVotes,
      timesSolved: errorCase.timesSolved,
      feedback: feedbackDoc
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 10. READ (R) - Get all feedback for an error case
 */
router.get('/:id/feedback', validateObjectId('id'), async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ errorCaseId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks
    });
  } catch (err) {
    next(err);
  }
});

export default router;
