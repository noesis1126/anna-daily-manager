// models/daily-manager/Task.js
import mongoose from 'mongoose';

const S = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    note: { type: String, default: '' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueTime: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'done', 'skipped'], default: 'pending' },
    assignedTo: { type: String, default: '' },
    date: { type: Date, required: true, index: true }, // IST day-start (template: start date)
    isTemplate: { type: Boolean, default: false },      // recurring daily task definition
    templateId: { type: mongoose.Schema.Types.ObjectId, default: null },
    doneAt: Date,
  },
  { timestamps: true }
);
S.index({ date: 1, status: 1 });
S.index({ templateId: 1, date: 1 }, { unique: true, partialFilterExpression: { templateId: { $type: 'objectId' } } });

export default mongoose.models.DmTask || mongoose.model('DmTask', S, 'dm_tasks');
