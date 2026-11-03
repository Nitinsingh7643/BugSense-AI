import mongoose from 'mongoose';

const CauseSchema = new mongoose.Schema({
  rank: {
    type: Number,
    required: [true, 'Cause rank is required'],
    min: [1, 'Cause rank must be at least 1']
  },
  title: {
    type: String,
    required: [true, 'Cause title is required'],
    trim: true,
    minlength: [2, 'Cause title must be at least 2 characters']
  },
  likelihood: {
    type: String,
    enum: {
      values: ['High', 'Medium', 'Low'],
      message: '{VALUE} is not a valid likelihood (High, Medium, Low)'
    },
    default: 'Medium'
  },
  explanation: {
    type: String,
    required: [true, 'Cause explanation is required'],
    trim: true,
    minlength: [5, 'Cause explanation must be at least 5 characters']
  }
}, { _id: false });

const SuggestedFixSchema = new mongoose.Schema({
  fixedCode: {
    type: String,
    required: [true, 'Fixed code solution is required'],
    trim: true,
    minlength: [1, 'Fixed code cannot be empty']
  },
  codeDiff: {
    type: String,
    default: ''
  },
  stepByStep: [{
    type: String,
    trim: true
  }],
  explanation: {
    type: String,
    required: [true, 'Solution explanation is required'],
    trim: true,
    minlength: [5, 'Solution explanation must be at least 5 characters']
  }
}, { _id: false });

const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp',
  'csharp', 'go', 'rust', 'php', 'ruby', 'html', 'css',
  'sql', 'shell', 'general'
];

const ErrorCaseSchema = new mongoose.Schema({
  errorSignature: {
    type: String,
    required: [true, 'Error signature hash is required'],
    index: true,
    trim: true
  },
  rawError: {
    type: String,
    required: [true, 'Raw error message or stack trace is required'],
    trim: true,
    minlength: [3, 'Raw error must be at least 3 characters long']
  },
  errorMessage: {
    type: String,
    required: [true, 'Error message is required'],
    trim: true,
    minlength: [3, 'Error message must be at least 3 characters long'],
    maxlength: [500, 'Error message cannot exceed 500 characters']
  },
  codeSnippet: {
    type: String,
    default: '',
    trim: true
  },
  language: {
    type: String,
    required: [true, 'Programming language is required'],
    lowercase: true,
    trim: true,
    index: true,
    enum: {
      values: SUPPORTED_LANGUAGES,
      message: '{VALUE} is not a supported language. Supported: ' + SUPPORTED_LANGUAGES.join(', ')
    }
  },
  errorType: {
    type: String,
    required: [true, 'Error type classification is required'],
    trim: true,
    index: true,
    minlength: [2, 'Error type must be at least 2 characters'],
    maxlength: [100, 'Error type cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    default: 'Runtime Error',
    index: true,
    trim: true,
    maxlength: [120, 'Category cannot exceed 120 characters']
  },
  severity: {
    type: String,
    required: [true, 'Severity level is required'],
    enum: {
      values: ['Critical', 'High', 'Medium', 'Low'],
      message: '{VALUE} is not a valid severity. Must be Critical, High, Medium, or Low.'
    },
    default: 'Medium',
    index: true
  },
  explanation: {
    type: String,
    required: [true, 'Root cause explanation is required'],
    trim: true,
    minlength: [10, 'Explanation must be at least 10 characters long']
  },
  causes: {
    type: [CauseSchema],
    default: []
  },
  suggestedFix: {
    type: SuggestedFixSchema,
    required: [true, 'Suggested fix details are required']
  },
  preventionTips: [{
    type: String,
    trim: true
  }],
  tags: {
    type: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    validate: {
      validator: function (tags) {
        if (!Array.isArray(tags)) return false;
        return tags.every(t => typeof t === 'string' && t.trim().length > 0 && t.length <= 40);
      },
      message: 'Each tag must be a non-empty string with maximum 40 characters.'
    },
    index: true
  },
  helpfulVotes: {
    type: Number,
    default: 0,
    min: [0, 'Helpful votes cannot be negative'],
    index: true
  },
  unhelpfulVotes: {
    type: Number,
    default: 0,
    min: [0, 'Unhelpful votes cannot be negative']
  },
  timesQueried: {
    type: Number,
    default: 1,
    min: [0, 'Query count cannot be negative'],
    index: true
  },
  timesSolved: {
    type: Number,
    default: 0,
    min: [0, 'Solved count cannot be negative'],
    index: true
  },
  source: {
    type: String,
    enum: {
      values: ['ai', 'verified_seed', 'community'],
      message: '{VALUE} is not a valid source'
    },
    default: 'community'
  }
}, {
  timestamps: true
});

// Compound index for fast language + error type lookups
ErrorCaseSchema.index({ language: 1, errorType: 1 });
ErrorCaseSchema.index({ severity: 1, language: 1 });

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
export { SUPPORTED_LANGUAGES };
