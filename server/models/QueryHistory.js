import mongoose from 'mongoose';

const QueryHistorySchema = new mongoose.Schema({
  queryText: {
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
    default: 'auto'
  },
  actionTaken: {
    type: String,
    enum: ['used_similar_cache', 'requested_ai_explanation', 'browsed_knowledge_base'],
    default: 'requested_ai_explanation'
  },
  matchedErrorCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ErrorCase'
  },
  similarityScore: {
    type: Number,
    default: 0
  },
  resolved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const QueryHistory = mongoose.model('QueryHistory', QueryHistorySchema);
