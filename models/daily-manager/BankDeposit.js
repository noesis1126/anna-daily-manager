// models/daily-manager/BankDeposit.js
import mongoose from 'mongoose';

const S = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 }, // INR
    date: { type: Date, required: true, index: true }, // IST day-start
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.DmBankDeposit || mongoose.model('DmBankDeposit', S, 'dm_bank_deposits');
