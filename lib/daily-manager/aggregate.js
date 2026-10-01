// lib/daily-manager/aggregate.js  (server only)
import Expense from '@/models/daily-manager/Expense';
import DailyEntry from '@/models/daily-manager/DailyEntry';
import BankDeposit from '@/models/daily-manager/BankDeposit';
import { dateToYmd } from './dates';

export const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const emptyRow = (date) => ({ date, sales: 0, cash: 0, online: 0, expense: 0, expCash: 0, expOnline: 0, deposit: 0, filled: false });
export const finalize = (r) => ({
  ...r,
  sales: r2(r.sales), cash: r2(r.cash), online: r2(r.online),
  expense: r2(r.expense), expCash: r2(r.expCash), expOnline: r2(r.expOnline), deposit: r2(r.deposit),
  profit: r2(r.sales - r.expense),
  cashInHand: r2(r.cash - r.expCash - r.deposit),
});
export function sumRows(rows) {
  const t = emptyRow('');
  for (const r of rows) for (const k of ['sales', 'cash', 'online', 'expense', 'expCash', 'expOnline', 'deposit']) t[k] += r[k];
  const { date, filled, ...rest } = finalize(t);
  return rest;
}

// Map of ymd -> raw totals for [start, end)
export async function dayMap(start, end) {
  const range = { $gte: start, $lt: end };
  const [entries, exp, dep] = await Promise.all([
    DailyEntry.find({ date: range }).lean(),
    Expense.aggregate([{ $match: { date: range } }, { $group: { _id: { d: '$date', m: '$mode' }, t: { $sum: '$cost' } } }]),
    BankDeposit.aggregate([{ $match: { date: range } }, { $group: { _id: '$date', t: { $sum: '$amount' } } }]),
  ]);
  const map = new Map();
  const row = (k) => {
    if (!map.has(k)) map.set(k, emptyRow(k));
    return map.get(k);
  };
  for (const e of entries) Object.assign(row(dateToYmd(e.date)), { sales: e.sales, cash: e.cash, online: e.online, filled: true });
  for (const x of exp) {
    const r = row(dateToYmd(x._id.d));
    r.expense += x.t;
    if (x._id.m === 'Cash') r.expCash += x.t;
    else r.expOnline += x.t;
  }
  for (const x of dep) row(dateToYmd(x._id)).deposit += x.t;
  return map;
}

export async function categoryBreakdown(start, end) {
  const rows = await Expense.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$cost' } } },
    { $sort: { total: -1 } },
  ]);
  const sum = rows.reduce((a, r) => a + r.total, 0);
  return rows.map((r) => ({ category: r._id, total: r2(r.total), pct: sum ? Math.round((r.total / sum) * 1000) / 10 : 0 }));
}

// cash sales - cash expenses - bank deposits, everything before `end`
export async function cashInHandUpTo(end) {
  const [c, e, d] = await Promise.all([
    DailyEntry.aggregate([{ $match: { date: { $lt: end } } }, { $group: { _id: null, t: { $sum: '$cash' } } }]),
    Expense.aggregate([{ $match: { date: { $lt: end }, mode: 'Cash' } }, { $group: { _id: null, t: { $sum: '$cost' } } }]),
    BankDeposit.aggregate([{ $match: { date: { $lt: end } } }, { $group: { _id: null, t: { $sum: '$amount' } } }]),
  ]);
  return r2((c[0]?.t || 0) - (e[0]?.t || 0) - (d[0]?.t || 0));
}
