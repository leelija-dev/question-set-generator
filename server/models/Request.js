import mongoose from 'mongoose';

const RequestSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['board', 'class', 'subject'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    payload: { type: Object, default: {} },
    customer: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    note: { type: String, trim: true },
    decisionAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

RequestSchema.index({ type: 1, status: 1, createdAt: -1 });

const Request = mongoose.model('Request', RequestSchema);
export default Request;
