import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    easyQuestions: { type: Number, default: 0 },
    mediumQuestions: { type: Number, default: 0 },
    hardQuestions: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'lastUpdated' } }
);

SubjectSchema.index({ boardId: 1, classId: 1, name: 1 }, { unique: true });

const Subject = mongoose.model('Subject', SubjectSchema);
export default Subject;
