// app/api/daily-manager/summary/route.js   GET ?date=YYYY-MM-DD
import Task from '@/models/daily-manager/Task';
import DailyEntry from '@/models/daily-manager/DailyEntry';
import BankDeposit from '@/models/daily-manager/BankDeposit';
import { handler, ok, qs, ser } from '@/lib/daily-manager/http';
import { ymd } from '@/lib/daily-manager/schemas';
import { addDays, todayYmd, ymdToDate } from '@/lib/daily-manager/dates';
import { categoryBreakdown, cashInHandUpTo, dayMap, emptyRow, finalize } from '@/lib/daily-manager/aggregate';
import { paidOrders } from '@/lib/daily-manager/orders';
import { ensureRecurring } from '@/lib/daily-manager/recurring';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  const date = ymd.parse(qs(req, 'date') || todayYmd());
  const start = ymdToDate(date);
  const end = ymdToDate(addDays(date, 1));
  await ensureRecurring(date);
  const [entry, map, categories, deposits, cashTotal, pending, orders] = await Promise.all([
    DailyEntry.findOne({ date: start }).lean(),
    dayMap(start, end),
    categoryBreakdown(start, end),
    BankDeposit.find({ date: start }).sort({ createdAt: 1 }).lean(),
    cashInHandUpTo(end),
    Task.countDocuments({ isTemplate: false, status: 'pending', date: { $lte: start } }),
    paidOrders(start, end),
  ]);
  const row = finalize(map.get(date) || emptyRow(date));
  return ok({
    ...row,
    date,
    entry: entry ? ser(entry) : null,
    entryMissing: !entry,
    categories,
    deposits: deposits.map(ser),
    cashInHandTotal: cashTotal,
    pendingTasks: pending,
    orders,
  });
});
