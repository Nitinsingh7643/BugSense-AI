import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  errorCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ErrorCase',
    required: [true, 'Valid ErrorCase ID is required'],
    index: true
  },
  resolvedIssue: {
    type: Boolean,
    required: [true, 'resolvedIssue boolean is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1 star'],
    max: [5, 'Rating cannot exceed 5 stars'],
    default: 5
  },
  studentComment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Student comment cannot exceed 1000 characters'],
    default: ''
  },
  studentLevel: {
    type: String,
    required: [true, 'Student experience level is required'],
    enum: {
      values: ['Beginner', 'Intermediate', 'Advanced'],
      message: '{VALUE} is not a valid level. Must be Beginner, Intermediate, or Advanced.'
    },
    default: 'Beginner'
  }
}, {
  timestamps: true
});

FeedbackSchema.index({ errorCaseId: 1, rating: -1 });

export const Feedback = mongoose.model('Feedback', FeedbackSchema);
