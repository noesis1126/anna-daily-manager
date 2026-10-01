// models/daily-manager/Expense.js
import mongoose from 'mongoose';

const S = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Grocery', 'Gas', 'Salary', 'Electricity', 'Rent', 'Packaging', 'Maintenance', 'Other'], required: true },
    quantity: { type: Number, default: null },
    unit: { type: String, enum: ['kg', 'g', 'litre', 'piece', 'packet', 'cylinder', ''], default: '' },
    cost: { type: Number, required: true, min: 0 }, // INR
    mode: { type: String, enum: ['Cash', 'Online'], required: true },
    date: { type: Date, required: true, index: true }, // IST day-start
    note: { type: String, default: '' },
  },
  { timestamps: true }
);
S.index({ date: 1, category: 1 });

export default mongoose.models.DmExpense || mongoose.model('DmExpense', S, 'dm_expenses');
