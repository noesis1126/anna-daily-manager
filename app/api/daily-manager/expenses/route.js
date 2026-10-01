// app/api/daily-manager/expenses/route.js
import Expense from '@/models/daily-manager/Expense';
import { handler, ok, qs, ser } from '@/lib/daily-manager/http';
import { expenseSchema, ymd } from '@/lib/daily-manager/schemas';
import { todayYmd, ymdToDate, addDays } from '@/lib/daily-manager/dates';
import { categoryBreakdown, r2 } from '@/lib/daily-manager/aggregate';

export const dynamic = 'force-dynamic';

// GET /api/daily-manager/expenses?date=YYYY-MM-DD
export const GET = handler(async (req) => {
  const date = ymd.parse(qs(req, 'date') || todayYmd());
  const start = ymdToDate(date);
  const end = ymdToDate(addDays(date, 1));
  const [items, categories] = await Promise.all([
    Expense.find({ date: start }).sort({ createdAt: -1 }).lean(),
    categoryBreakdown(start, end),
  ]);
  const sum = (m) => r2(items.filter((i) => !m || i.mode === m).reduce((a, i) => a + i.cost, 0));
  return ok({ date, items: items.map(ser), total: sum(), cash: sum('Cash'), online: sum('Online'), categories });
});

export const POST = handler(async (req) => {
  const d = expenseSchema.parse(await req.json());
  const doc = await Expense.create({ ...d, date: ymdToDate(d.date) });
  return ok(ser(doc), 201);
});
