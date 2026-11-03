import { SUPPORTED_LANGUAGES } from '../models/ErrorCase.js';
import mongoose from 'mongoose';

/**
 * Validates error case creation and update payloads
 */
export function validateErrorCasePayload(isUpdate = false) {
  return (req, res, next) => {
    const { errorMessage, language, explanation, severity, suggestedFix, tags, causes } = req.body;
    const errors = [];

    // On creation, these are required
    if (!isUpdate) {
      if (!errorMessage || typeof errorMessage !== 'string' || errorMessage.trim().length < 3) {
        errors.push({
          field: 'errorMessage',
          message: 'Error message is required and must be at least 3 characters long.'
        });
      }

      if (!explanation || typeof explanation !== 'string' || explanation.trim().length < 10) {
        errors.push({
          field: 'explanation',
          message: 'Explanation is required and must be at least 10 characters long.'
        });
      }
    } else {
      // On update, if provided, must meet constraints
      if (errorMessage !== undefined && (typeof errorMessage !== 'string' || errorMessage.trim().length < 3)) {
        errors.push({
          field: 'errorMessage',
          message: 'Error message must be at least 3 characters long.'
        });
      }
      if (explanation !== undefined && (typeof explanation !== 'string' || explanation.trim().length < 10)) {
        errors.push({
          field: 'explanation',
          message: 'Explanation must be at least 10 characters long.'
        });
      }
    }

    // Language validation
    if (language !== undefined && language !== 'auto') {
      const normalizedLang = String(language).toLowerCase().trim();
      if (!SUPPORTED_LANGUAGES.includes(normalizedLang)) {
        errors.push({
          field: 'language',
          message: `Invalid language '${language}'. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
        });
      }
    }

    // Severity validation
    if (severity !== undefined) {
      const validSeverities = ['Critical', 'High', 'Medium', 'Low'];
      if (!validSeverities.includes(severity)) {
        errors.push({
          field: 'severity',
          message: `Invalid severity '${severity}'. Must be one of: ${validSeverities.join(', ')}`
        });
      }
    }

    // SuggestedFix validation if supplied as object
    if (suggestedFix !== undefined && typeof suggestedFix === 'object' && suggestedFix !== null) {
      if (suggestedFix.fixedCode !== undefined && typeof suggestedFix.fixedCode !== 'string') {
        errors.push({
          field: 'suggestedFix.fixedCode',
          message: 'Suggested fix code must be a string.'
        });
      }
    }

    // Tags validation
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        for (let i = 0; i < tags.length; i++) {
          if (typeof tags[i] !== 'string' || tags[i].trim().length === 0 || tags[i].length > 40) {
            errors.push({
              field: `tags[${i}]`,
              message: 'Each tag must be a non-empty string with maximum 40 characters.'
            });
            break;
          }
        }
      } else if (typeof tags !== 'string') {
        errors.push({
          field: 'tags',
          message: 'Tags must be an array of strings or comma-separated string.'
        });
      }
    }

    // Causes validation
    if (causes !== undefined && Array.isArray(causes)) {
      causes.forEach((cause, idx) => {
        if (!cause.title || cause.title.trim().length < 2) {
          errors.push({
            field: `causes[${idx}].title`,
            message: `Cause #${idx + 1} requires a valid title.`
          });
        }
        if (!cause.explanation || cause.explanation.trim().length < 5) {
          errors.push({
            field: `causes[${idx}].explanation`,
            message: `Cause #${idx + 1} requires an explanation.`
          });
        }
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Invalid error case payload',
        errors
      });
    }

    next();
  };
}

/**
 * Validates feedback submission payload
 */
export function validateFeedbackPayload(req, res, next) {
  const { resolvedIssue, rating, studentLevel, studentComment } = req.body;
  const errors = [];

  if (resolvedIssue === undefined || typeof resolvedIssue !== 'boolean') {
    errors.push({
      field: 'resolvedIssue',
      message: 'resolvedIssue must be a boolean (true or false).'
    });
  }

  if (rating !== undefined) {
    const num = Number(rating);
    if (isNaN(num) || num < 1 || num > 5) {
      errors.push({
        field: 'rating',
        message: 'Rating must be an integer between 1 and 5.'
      });
    }
  }

  if (studentLevel !== undefined) {
    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validLevels.includes(studentLevel)) {
      errors.push({
        field: 'studentLevel',
        message: `studentLevel must be one of: ${validLevels.join(', ')}`
      });
    }
  }

  if (studentComment !== undefined && studentComment.length > 1000) {
    errors.push({
      field: 'studentComment',
      message: 'studentComment cannot exceed 1000 characters.'
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Invalid feedback submission',
      errors
    });
  }

  next();
}

/**
 * Validates that an ID parameter is a valid 24-character hex MongoDB ObjectId
 */
export function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid MongoDB ObjectId: '${id}' for parameter '${paramName}'. Must be a 24-character hexadecimal string.`
      });
    }
    next();
  };
}
