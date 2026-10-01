// app/api/daily-manager/deposits/[id]/route.js
import BankDeposit from '@/models/daily-manager/BankDeposit';
import { fail, handler, ok, ser } from '@/lib/daily-manager/http';
import { depositSchema } from '@/lib/daily-manager/schemas';
import { ymdToDate } from '@/lib/daily-manager/dates';

export const dynamic = 'force-dynamic';

export const GET = handler(async (_req, ctx) => {
  const { id } = await ctx.params;
  const doc = await BankDeposit.findById(id);
  return doc ? ok(ser(doc)) : fail('Deposit not found', 404);
});

export const PATCH = handler(async (req, ctx) => {
  const { id } = await ctx.params;
  const d = depositSchema.parse(await req.json());
  const doc = await BankDeposit.findById(id);
  if (!doc) return fail('Deposit not found', 404);
  doc.set({ ...d, date: ymdToDate(d.date) });
  await doc.save();
  return ok(ser(doc));
});

export const DELETE = handler(async (_req, ctx) => {
  const { id } = await ctx.params;
  const doc = await BankDeposit.findByIdAndDelete(id);
  return doc ? ok({ deleted: true }) : fail('Deposit not found', 404);
});
