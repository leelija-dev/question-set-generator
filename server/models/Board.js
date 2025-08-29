import mongoose from 'mongoose';

const BoardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, trim: true },
    status: { type: Number, enum: [0, 1], default: 1, index: true },
    metrics: {
      classes: { type: Number, default: 0 },
      subjects: { type: Number, default: 0 },
      institutions: { type: Number, default: 0 },
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'lastUpdated' } }
);

const Board = mongoose.model('Board', BoardSchema);
export default Board;
