// app/api/daily-manager/yearly/route.js   GET ?year=YYYY
import { handler, ok, qs } from '@/lib/daily-manager/http';
import { yearStr } from '@/lib/daily-manager/schemas';
import { todayYmd, ymdToDate } from '@/lib/daily-manager/dates';
import { dayMap, emptyRow, finalize, sumRows } from '@/lib/daily-manager/aggregate';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  const year = yearStr.parse(qs(req, 'year') || todayYmd().slice(0, 4));
  const map = await dayMap(ymdToDate(`${year}-01-01`), ymdToDate(`${Number(year) + 1}-01-01`));
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = `${year}-${String(i + 1).padStart(2, '0')}`;
    const rows = [...map.values()].filter((r) => r.date.startsWith(m));
    return { month: m, ...sumRows(rows.length ? rows : [emptyRow(m)]) };
  });
  const active = months.filter((m) => m.sales > 0 || m.expense > 0);
  const best = active.length ? active.reduce((a, b) => (b.profit > a.profit ? b : a)) : null;
  const worst = active.length ? active.reduce((a, b) => (b.profit < a.profit ? b : a)) : null;
  return ok({ year, months, totals: sumRows([...map.values()].map((r) => finalize(r))), best, worst });
});
