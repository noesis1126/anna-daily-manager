// components/daily-manager/ReportsView.jsx
'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronLeft, ChevronRight, FileDown, FileSpreadsheet, TrendingDown, TrendingUp } from 'lucide-react';
import { useFetch } from '@/lib/daily-manager/useFetch';
import { API } from '@/lib/daily-manager/constants';
import { compact, inr } from '@/lib/daily-manager/format';
import { monthName, prettyDate, prettyMonth, shiftMonth, shortDate, todayYmd } from '@/lib/daily-manager/dates';
import CategoryBreakdown from './CategoryBreakdown';
import { Btn, Card, ErrorBox, IconBtn, PageTitle, Skeleton, cx, inputCls } from './ui';

const signed = (n) => `${n < 0 ? '-' : ''}${inr(Math.abs(n))}`;
const tone = (n) => (n > 0 ? 'bg-green-50 text-green-800' : n < 0 ? 'bg-red-50 text-red-800' : 'text-stone-400');

function Metric({ label, value, cls }) {
  return (
    <Card className="!p-3.5">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className={cx('mt-1 truncate text-lg font-bold text-stone-900 md:text-xl', cls)}>{value}</p>
    </Card>
  );
}

function Tabs({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 rounded-xl bg-stone-200/70 p-1">
      {[['monthly', 'Monthly'], ['yearly', 'Yearly']].map(([k, l]) => (
        <button key={k} type="button" onClick={() => onChange(k)}
          className={cx('min-h-[44px] rounded-lg text-sm font-bold transition', value === k ? 'bg-white text-red-700 shadow-sm' : 'text-stone-600')}>{l}</button>
      ))}
    </div>
  );
}

function Skel() {
  return <div className="space-y-3"><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div><Skeleton className="h-72" /></div>;
}

function Monthly() {
  const [month, setMonth] = useState(todayYmd().slice(0, 7));
  const { data: m, error, loading } = useFetch(`${API}/monthly?month=${month}`);
  const [exporting, setExporting] = useState('');

  async function doExport(kind) {
    setExporting(kind);
    try {
      const { exportMonthly } = await import('@/lib/daily-manager/export');
      await exportMonthly(kind, m);
      toast.success('Report downloaded');
    } catch {
      toast.error('Could not create the report');
    } finally {
      setExporting('');
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <IconBtn label="Previous month" className="border border-stone-300 bg-white" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft className="h-5 w-5" /></IconBtn>
        <input type="month" aria-label="Pick a month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className={inputCls(false) + ' min-w-0 flex-1 font-semibold'} />
        <IconBtn label="Next month" className="border border-stone-300 bg-white" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight className="h-5 w-5" /></IconBtn>
      </div>
      {loading ? <Skel /> : error ? <ErrorBox message={error} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Metric label="Total sales" value={inr(m.totals.sales)} />
            <Metric label="Total money gone out" value={inr(m.moneyOut)} cls="text-red-700" />
            <Metric label="Profit / loss" value={signed(m.totals.profit)} cls={m.totals.profit >= 0 ? 'text-green-700' : 'text-red-700'} />
            <Metric label="Bank income (deposits)" value={inr(m.bankIncome)} />
            <Metric label="Cash in hand (this month)" value={signed(m.cashInHand)} />
            <Metric label="Cash in hand (total)" value={signed(m.cashInHandTotal)} />
          </div>

          {m.best && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="flex items-center gap-3 border-green-200 bg-green-50 !p-3.5">
                <TrendingUp className="h-8 w-8 shrink-0 text-green-700" />
                <div><p className="text-xs font-medium text-green-800">Best day</p><p className="font-bold text-green-900">{prettyDate(m.best.date)}</p><p className="text-sm font-semibold text-green-800">{signed(m.best.profit)}</p></div>
              </Card>
              <Card className="flex items-center gap-3 border-red-200 bg-red-50 !p-3.5">
                <TrendingDown className="h-8 w-8 shrink-0 text-red-700" />
                <div><p className="text-xs font-medium text-red-800">Worst day</p><p className="font-bold text-red-900">{prettyDate(m.worst.date)}</p><p className="text-sm font-semibold text-red-800">{signed(m.worst.profit)}</p></div>
              </Card>
            </div>
          )}

          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-stone-100 text-left text-xs font-bold text-stone-600">
                  <tr><th className="px-3 py-3">Day</th><th className="px-3 py-3 text-right">Sales</th><th className="px-3 py-3 text-right">Cash</th><th className="px-3 py-3 text-right">Online</th><th className="px-3 py-3 text-right">Expense</th><th className="px-3 py-3 text-right">Profit</th></tr>
                </thead>
                <tbody>
                  {m.days.map((d) => {
                    const idle = !d.filled && d.expense === 0;
                    return (
                      <tr key={d.date} className={cx('border-t border-stone-100', idle ? 'text-stone-400' : tone(d.profit))}>
                        <td className="whitespace-nowrap px-3 py-2.5 font-medium">{shortDate(d.date)}</td>
                        <td className="px-3 py-2.5 text-right">{inr(d.sales)}</td>
                        <td className="px-3 py-2.5 text-right">{inr(d.cash)}</td>
                        <td className="px-3 py-2.5 text-right">{inr(d.online)}</td>
                        <td className="px-3 py-2.5 text-right">{inr(d.expense)}</td>
                        <td className="px-3 py-2.5 text-right font-bold">{idle ? '-' : signed(d.profit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-amber-100 font-bold text-stone-900">
                  <tr><td className="px-3 py-3">Total</td><td className="px-3 py-3 text-right">{inr(m.totals.sales)}</td><td className="px-3 py-3 text-right">{inr(m.totals.cash)}</td><td className="px-3 py-3 text-right">{inr(m.totals.online)}</td><td className="px-3 py-3 text-right">{inr(m.totals.expense)}</td>
                    <td className={cx('px-3 py-3 text-right', m.totals.profit >= 0 ? 'text-green-800' : 'text-red-800')}>{signed(m.totals.profit)}</td></tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-bold text-stone-900">Expenses by category</h2>
            <CategoryBreakdown data={m.categories} />
          </Card>

          <div className="flex flex-wrap gap-3">
            <Btn variant="ghost" loading={exporting === 'xlsx'} disabled={!!exporting} onClick={() => doExport('xlsx')}><FileSpreadsheet className="h-5 w-5 text-green-700" /> Monthly report (Excel)</Btn>
            <Btn variant="ghost" loading={exporting === 'pdf'} disabled={!!exporting} onClick={() => doExport('pdf')}><FileDown className="h-5 w-5 text-red-700" /> Monthly report (PDF)</Btn>
          </div>
          <p className="text-xs text-stone-500">{prettyMonth(month)}. Green days made a profit, red days made a loss.</p>
        </>
      )}
    </>
  );
}

function Yearly() {
  const [year, setYear] = useState(todayYmd().slice(0, 4));
  const { data: y, error, loading } = useFetch(`${API}/yearly?year=${year}`);
  const step = (n) => setYear(String(Number(year) + n));
  const chart = y ? y.months.map((m) => ({ label: monthName(m.month), Sales: m.sales, Expense: m.expense, Profit: m.profit })) : [];

  return (
    <>
      <div className="flex items-center gap-2">
        <IconBtn label="Previous year" className="border border-stone-300 bg-white" onClick={() => step(-1)}><ChevronLeft className="h-5 w-5" /></IconBtn>
        <div className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-stone-300 bg-white text-lg font-bold">{year}</div>
        <IconBtn label="Next year" className="border border-stone-300 bg-white" onClick={() => step(1)}><ChevronRight className="h-5 w-5" /></IconBtn>
      </div>
      {loading ? <Skel /> : error ? <ErrorBox message={error} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Total sales" value={inr(y.totals.sales)} />
            <Metric label="Total expense" value={inr(y.totals.expense)} cls="text-red-700" />
            <Metric label="Profit / loss" value={signed(y.totals.profit)} cls={y.totals.profit >= 0 ? 'text-green-700' : 'text-red-700'} />
            <Metric label="Bank income (deposits)" value={inr(y.totals.deposit)} />
          </div>
          <Card>
            <h2 className="mb-3 text-base font-bold text-stone-900">Month-wise sales, expense and profit</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={compact} width={44} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => inr(v)} />
                  <Legend />
                  <Bar dataKey="Sales" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Expense" fill="#dc2626" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Profit" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-stone-100 text-left text-xs font-bold text-stone-600">
                  <tr><th className="px-3 py-3">Month</th><th className="px-3 py-3 text-right">Sales</th><th className="px-3 py-3 text-right">Expense</th><th className="px-3 py-3 text-right">Profit</th><th className="px-3 py-3 text-right">Deposits</th></tr>
                </thead>
                <tbody>
                  {y.months.map((m) => {
                    const idle = m.sales === 0 && m.expense === 0;
                    return (
                      <tr key={m.month} className={cx('border-t border-stone-100', idle ? 'text-stone-400' : tone(m.profit))}>
                        <td className="px-3 py-2.5 font-medium">{prettyMonth(m.month)}</td>
                        <td className="px-3 py-2.5 text-right">{inr(m.sales)}</td>
                        <td className="px-3 py-2.5 text-right">{inr(m.expense)}</td>
                        <td className="px-3 py-2.5 text-right font-bold">{idle ? '-' : signed(m.profit)}</td>
                        <td className="px-3 py-2.5 text-right">{inr(m.deposit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-amber-100 font-bold text-stone-900">
                  <tr><td className="px-3 py-3">Total</td><td className="px-3 py-3 text-right">{inr(y.totals.sales)}</td><td className="px-3 py-3 text-right">{inr(y.totals.expense)}</td>
                    <td className={cx('px-3 py-3 text-right', y.totals.profit >= 0 ? 'text-green-800' : 'text-red-800')}>{signed(y.totals.profit)}</td><td className="px-3 py-3 text-right">{inr(y.totals.deposit)}</td></tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

export default function ReportsView() {
  const [tab, setTab] = useState('monthly');
  return (
    <>
      <PageTitle title="Reports" />
      <Tabs value={tab} onChange={setTab} />
      {tab === 'monthly' ? <Monthly /> : <Yearly />}
    </>
  );
}
