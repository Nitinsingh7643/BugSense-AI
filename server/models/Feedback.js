import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  errorCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ErrorCase',
    required: true,
    index: true
  },
  resolvedIssue: {
    type: Boolean,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  studentComment: {
    type: String,
    default: ''
  },
  studentLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  }
}, {
  timestamps: true
});

export const Feedback = mongoose.model('Feedback', FeedbackSchema);
