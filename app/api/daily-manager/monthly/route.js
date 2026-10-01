// app/api/daily-manager/monthly/route.js   GET ?month=YYYY-MM
import { handler, ok, qs } from '@/lib/daily-manager/http';
import { ym } from '@/lib/daily-manager/schemas';
import { daysInMonth, monthStart, shiftMonth, todayYmd } from '@/lib/daily-manager/dates';
import { categoryBreakdown, cashInHandUpTo, dayMap, emptyRow, finalize, sumRows } from '@/lib/daily-manager/aggregate';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  const month = ym.parse(qs(req, 'month') || todayYmd().slice(0, 7));
  const start = monthStart(month);
  const end = monthStart(shiftMonth(month, 1));
  const [map, categories, cashTotal] = await Promise.all([dayMap(start, end), categoryBreakdown(start, end), cashInHandUpTo(end)]);
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => {
    const d = `${month}-${String(i + 1).padStart(2, '0')}`;
    return finalize(map.get(d) || emptyRow(d));
  });
  const active = days.filter((d) => d.filled || d.expense > 0);
  const best = active.length ? active.reduce((a, b) => (b.profit > a.profit ? b : a)) : null;
  const worst = active.length ? active.reduce((a, b) => (b.profit < a.profit ? b : a)) : null;
  const totals = sumRows(days);
  return ok({
    month,
    days,
    totals,
    best,
    worst,
    categories,
    moneyOut: totals.expense,
    bankIncome: totals.deposit,
    cashInHand: totals.cashInHand,
    cashInHandTotal: cashTotal,
  });
});
