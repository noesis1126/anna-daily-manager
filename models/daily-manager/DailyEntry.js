// models/daily-manager/DailyEntry.js
import mongoose from 'mongoose';

const S = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true }, // IST day-start (unique index)
    sales: { type: Number, required: true, min: 0 },    // INR
    cash: { type: Number, default: 0, min: 0 },
    online: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.DmDailyEntry || mongoose.model('DmDailyEntry', S, 'dm_daily_entries');
