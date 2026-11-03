import mongoose from 'mongoose';

const QueryHistorySchema = new mongoose.Schema({
  queryText: {
    type: String,
    required: [true, 'Query text is required'],
    trim: true,
    minlength: [2, 'Query text must be at least 2 characters long'],
    maxlength: [5000, 'Query text cannot exceed 5000 characters']
  },
  codeSnippet: {
    type: String,
    default: '',
    trim: true,
    maxlength: [20000, 'Code snippet exceeds maximum permitted length']
  },
  language: {
    type: String,
    default: 'auto',
    trim: true,
    lowercase: true
  },
  actionTaken: {
    type: String,
    enum: {
      values: ['used_similar_cache', 'requested_ai_explanation', 'browsed_knowledge_base'],
      message: '{VALUE} is not a valid action'
    },
    default: 'requested_ai_explanation',
    index: true
  },
  matchedErrorCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ErrorCase'
  },
  similarityScore: {
    type: Number,
    min: [0, 'Similarity score cannot be negative'],
    max: [100, 'Similarity score cannot exceed 100'],
    default: 0
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

QueryHistorySchema.index({ createdAt: -1 });

export const QueryHistory = mongoose.model('QueryHistory', QueryHistorySchema);
