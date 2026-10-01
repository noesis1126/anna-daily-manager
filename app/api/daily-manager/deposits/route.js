// app/api/daily-manager/deposits/route.js
import BankDeposit from '@/models/daily-manager/BankDeposit';
import { handler, ok, qs, ser } from '@/lib/daily-manager/http';
import { depositSchema, ymd } from '@/lib/daily-manager/schemas';
import { todayYmd, ymdToDate } from '@/lib/daily-manager/dates';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  const date = ymd.parse(qs(req, 'date') || todayYmd());
  const items = await BankDeposit.find({ date: ymdToDate(date) }).sort({ createdAt: 1 }).lean();
  return ok({ date, items: items.map(ser), total: items.reduce((a, i) => a + i.amount, 0) });
});

export const POST = handler(async (req) => {
  const d = depositSchema.parse(await req.json());
  const doc = await BankDeposit.create({ ...d, date: ymdToDate(d.date) });
  return ok(ser(doc), 201);
});
