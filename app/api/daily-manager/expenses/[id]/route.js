// app/api/daily-manager/expenses/[id]/route.js
import Expense from '@/models/daily-manager/Expense';
import { fail, handler, ok, ser } from '@/lib/daily-manager/http';
import { expenseSchema } from '@/lib/daily-manager/schemas';
import { ymdToDate } from '@/lib/daily-manager/dates';

export const dynamic = 'force-dynamic';

export const GET = handler(async (_req, ctx) => {
  const { id } = await ctx.params;
  const doc = await Expense.findById(id);
  return doc ? ok(ser(doc)) : fail('Expense not found', 404);
});

export const PATCH = handler(async (req, ctx) => {
  const { id } = await ctx.params;
  const d = expenseSchema.parse(await req.json());
  const doc = await Expense.findById(id);
  if (!doc) return fail('Expense not found', 404);
  doc.set({ ...d, date: ymdToDate(d.date) });
  await doc.save();
  return ok(ser(doc));
});

export const DELETE = handler(async (_req, ctx) => {
  const { id } = await ctx.params;
  const doc = await Expense.findByIdAndDelete(id);
  return doc ? ok({ deleted: true }) : fail('Expense not found', 404);
});
