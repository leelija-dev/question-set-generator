import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    metrics: {
      subjects: { type: Number, default: 0 },
      sections: { type: Number, default: 0 },
      students: { type: Number, default: 0 },
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'lastUpdated' } }
);

ClassSchema.index({ boardId: 1, name: 1 }, { unique: true });

const ClassModel = mongoose.model('Class', ClassSchema);
export default ClassModel;
