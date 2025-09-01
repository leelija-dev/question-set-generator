import mongoose from 'mongoose';

const QuestionSetSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true,
    trim: true
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  examDate: {
    type: String,
    required: true
  },
  examTime: {
    type: String,
    required: true
  },
  questionGroups: [{
    marks: {
      type: Number,
      required: true
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 0
    },
    difficulty: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 }
    }
  }],
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  totalQuestions: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: Number,
    enum: [0, 1], // 0 = draft, 1 = published
    default: 1
  }
}, { timestamps: true });

// Index for efficient queries
QuestionSetSchema.index({ board: 1, class: 1, subject: 1 });
QuestionSetSchema.index({ examName: 1 });

export default mongoose.model('QuestionSet', QuestionSetSchema);