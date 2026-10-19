import express from 'express';
import { ErrorCase } from '../models/ErrorCase.js';
import { Feedback } from '../models/Feedback.js';
import { QueryHistory } from '../models/QueryHistory.js';
import { findSimilarSolvedErrors, generateErrorSignature, detectLanguage } from '../services/similarityService.js';
import { explainErrorWithAI } from '../services/aiService.js';

const router = express.Router();

/**
 * 1. Find previously solved similar errors before requesting a new AI explanation
 */
router.post('/search-similar', async (req, res) => {
  try {
    const { errorText, codeSnippet, language } = req.body;

    if (!errorText && !codeSnippet) {
      return res.status(400).json({ error: 'Please provide an error message or code snippet.' });
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
    console.error('[Error Route] search-similar failed:', err);
    res.status(500).json({ error: 'Failed to search similar errors in MongoDB.', details: err.message });
  }
});

/**
 * 2. Analyze error with AI, classify, and store in MongoDB
 */
router.post('/analyze', async (req, res) => {
  try {
    const { errorText, codeSnippet, language, userApiKey, chosenSimilarId } = req.body;

    if (!errorText && !codeSnippet) {
      return res.status(400).json({ error: 'Error text or code snippet is required for analysis.' });
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

    const signature = generateErrorSignature(errorText, detectedLang);

    // Check if identical signature already exists in MongoDB
    let errorCase = await ErrorCase.findOne({ errorSignature: signature });

    if (errorCase) {
      // Update existing case frequency
      errorCase.timesQueried += 1;
      if (codeSnippet && !errorCase.codeSnippet) {
        errorCase.codeSnippet = codeSnippet;
      }
      await errorCase.save();
    } else {
      // Store new case in MongoDB
      errorCase = await ErrorCase.create({
        errorSignature: signature,
        rawError: errorText,
        errorMessage: (errorText || '').split('\n')[0].slice(0, 200),
        codeSnippet: codeSnippet || '',
        language: detectedLang,
        errorType: aiResult.errorType || 'RuntimeError',
        category: aiResult.category || 'Runtime Execution Error',
        severity: aiResult.severity || 'Medium',
        explanation: aiResult.explanation,
        causes: aiResult.causes || [],
        suggestedFix: aiResult.suggestedFix,
        preventionTips: aiResult.preventionTips || [],
        tags: aiResult.tags || [detectedLang],
        source: 'ai',
        timesQueried: 1,
        timesSolved: 0
      });
    }

    // Record in student query history
    await QueryHistory.create({
      queryText: errorText,
      codeSnippet: codeSnippet || '',
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
    console.error('[Error Route] analyze failed:', err);
    res.status(500).json({ error: 'AI Error analysis failed.', details: err.message });
  }
});

/**
 * 3. List & filter solved errors in MongoDB knowledge base
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, language, tag, search, sortBy = 'helpful' } = req.query;

    const filter = {};
    if (language && language !== 'all') {
      filter.language = language.toLowerCase();
    }
    if (tag) {
      filter.tags = tag.toLowerCase();
    }
    if (search) {
      filter.$or = [
        { errorMessage: { $regex: search, $options: 'i' } },
        { errorType: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    let sort = { helpfulVotes: -1 };
    if (sortBy === 'recent') sort = { createdAt: -1 };
    if (sortBy === 'views') sort = { timesQueried: -1 };
    if (sortBy === 'solved') sort = { timesSolved: -1 };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
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
      pages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    console.error('[Error Route] list failed:', err);
    res.status(500).json({ error: 'Failed to list error cases.', details: err.message });
  }
});

/**
 * 4. Get specific error case by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const errorCase = await ErrorCase.findById(req.params.id);
    if (!errorCase) {
      return res.status(404).json({ error: 'Error case not found in MongoDB.' });
    }

    // Increment query/view count
    errorCase.timesQueried += 1;
    await errorCase.save();

    res.json({ success: true, errorCase });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve error case.', details: err.message });
  }
});

/**
 * 5. Record Student Feedback & Helpfulness
 */
router.post('/:id/feedback', async (req, res) => {
  try {
    const { resolvedIssue, rating = 5, studentComment = '', studentLevel = 'Beginner' } = req.body;
    const errorCase = await ErrorCase.findById(req.params.id);

    if (!errorCase) {
      return res.status(404).json({ error: 'Error case not found.' });
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

    res.json({
      success: true,
      message: 'Feedback saved to MongoDB successfully!',
      helpfulVotes: errorCase.helpfulVotes,
      unhelpfulVotes: errorCase.unhelpfulVotes,
      timesSolved: errorCase.timesSolved,
      feedback: feedbackDoc
    });
  } catch (err) {
    console.error('[Error Route] feedback failed:', err);
    res.status(500).json({ error: 'Failed to record feedback.', details: err.message });
  }
});

/**
 * 6. CREATE (C) - Manually create a new Error Case / Solution
 */
router.post('/', async (req, res) => {
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

    if (!errorMessage || !explanation) {
      return res.status(400).json({ error: 'errorMessage and explanation are required fields.' });
    }

    const raw = rawError || errorMessage;
    const lang = (language && language !== 'auto' ? language : 'javascript').toLowerCase().trim();
    const signature = generateErrorSignature(raw, lang);

    // Format suggestedFix if sent as a string or object
    const formattedFix = {
      fixedCode: typeof suggestedFix === 'string' ? suggestedFix : (suggestedFix?.fixedCode || ''),
      explanation: (typeof suggestedFix === 'object' && suggestedFix?.explanation) ? suggestedFix.explanation : 'Apply verified fix.',
      codeDiff: (typeof suggestedFix === 'object' && suggestedFix?.codeDiff) ? suggestedFix.codeDiff : '',
      stepByStep: (typeof suggestedFix === 'object' && Array.isArray(suggestedFix?.stepByStep)) ? suggestedFix.stepByStep : []
    };

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
      tags: Array.isArray(tags) 
        ? tags.map(t => String(t).toLowerCase().trim()) 
        : (typeof tags === 'string' ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [lang]),
      source: 'community',
      timesQueried: 1,
      timesSolved: 1
    });

    res.status(201).json({
      success: true,
      message: 'Error case created successfully in MongoDB!',
      errorCase: newErrorCase
    });
  } catch (err) {
    console.error('[Error Route] create errorCase failed:', err);
    res.status(500).json({ error: 'Failed to create error case in MongoDB.', details: err.message });
  }
});

/**
 * 7. UPDATE (U) - Update an existing Error Case by ID
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const errorCase = await ErrorCase.findById(id);

    if (!errorCase) {
      return res.status(404).json({ error: 'Error case not found in MongoDB.' });
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
    if (severity !== undefined && ['Critical', 'High', 'Medium', 'Low'].includes(severity)) {
      errorCase.severity = severity;
    }
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
        ? tags.map(t => String(t).toLowerCase().trim())
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
      message: 'Error case updated successfully in MongoDB!',
      errorCase
    });
  } catch (err) {
    console.error('[Error Route] update errorCase failed:', err);
    res.status(500).json({ error: 'Failed to update error case.', details: err.message });
  }
});

/**
 * 8. DELETE (D) - Delete an Error Case by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCase = await ErrorCase.findByIdAndDelete(id);

    if (!deletedCase) {
      return res.status(404).json({ error: 'Error case not found in MongoDB.' });
    }

    // Clean up any associated feedback documents
    await Feedback.deleteMany({ errorCaseId: id });

    res.json({
      success: true,
      message: 'Error case deleted successfully from MongoDB!',
      deletedId: id
    });
  } catch (err) {
    console.error('[Error Route] delete errorCase failed:', err);
    res.status(500).json({ error: 'Failed to delete error case.', details: err.message });
  }
});

export default router;
