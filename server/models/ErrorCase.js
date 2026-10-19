import mongoose from 'mongoose';

const CauseSchema = new mongoose.Schema({
  rank: { type: Number, required: true },
  title: { type: String, required: true },
  likelihood: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  explanation: { type: String, required: true }
}, { _id: false });

const SuggestedFixSchema = new mongoose.Schema({
  fixedCode: { type: String, required: true },
  codeDiff: { type: String },
  stepByStep: [{ type: String }],
  explanation: { type: String, required: true }
}, { _id: false });

const ErrorCaseSchema = new mongoose.Schema({
  errorSignature: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  rawError: {
    type: String,
    required: true,
    trim: true
  },
  errorMessage: {
    type: String,
    required: true,
    trim: true
  },
  codeSnippet: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  errorType: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    default: 'Runtime Error',
    index: true
  },
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  explanation: {
    type: String,
    required: true
  },
  causes: [CauseSchema],
  suggestedFix: SuggestedFixSchema,
  preventionTips: [{ type: String }],
  tags: [{ type: String, lowercase: true, trim: true }],
  helpfulVotes: {
    type: Number,
    default: 0,
    index: true
  },
  unhelpfulVotes: {
    type: Number,
    default: 0
  },
  timesQueried: {
    type: Number,
    default: 1
  },
  timesSolved: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ['ai', 'verified_seed', 'community'],
    default: 'ai'
  }
}, {
  timestamps: true
});

// Compound index for fast language + error type lookups
ErrorCaseSchema.index({ language: 1, errorType: 1 });

// Full text search index with weighted fields
ErrorCaseSchema.index({
  errorMessage: 'text',
  codeSnippet: 'text',
  tags: 'text',
  explanation: 'text'
}, {
  weights: {
    errorMessage: 10,
    tags: 6,
    codeSnippet: 3,
    explanation: 1
  },
  default_language: 'english',
  language_override: 'text_search_language',
  name: 'ErrorCaseTextIndex'
});

export const ErrorCase = mongoose.model('ErrorCase', ErrorCaseSchema);
