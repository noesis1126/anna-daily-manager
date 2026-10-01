// components/daily-manager/TodayView.jsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AlertTriangle, ArrowRight, Banknote, FileDown, FileSpreadsheet, IndianRupee, Landmark, ListTodo, Pencil, Plus, Receipt, ShoppingBag, Smartphone, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useDM } from '@/lib/daily-manager/context';
import { useFetch } from '@/lib/daily-manager/useFetch';
import { api } from '@/lib/daily-manager/api';
import { API, BASE, CAT_COLORS } from '@/lib/daily-manager/constants';
import { inr } from '@/lib/daily-manager/format';
import { prettyDate, prettyTime, todayYmd } from '@/lib/daily-manager/dates';
import DateBar from './DateBar';
import { Btn, Card, ConfirmDialog, Empty, ErrorBox, IconBtn, Skeleton, cx } from './ui';

const TONES = {
  amber: 'bg-amber-50 text-amber-600', green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600',
  blue: 'bg-sky-50 text-sky-600', stone: 'bg-stone-100 text-stone-600',
};

function Kpi({ label, value, sub, icon: Icon, tone = 'stone', valueCls }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
        <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg', TONES[tone])}><Icon className="h-4 w-4" /></span>
      </div>
      <p className={cx('mt-2 truncate text-2xl font-bold tabular-nums text-stone-900', valueCls)}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-stone-500">{sub}</p>}
    </Card>
  );
}

function MiniStat({ label, value, icon: Icon, href }) {
  const body = (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-stone-400" />
      <div className="min-w-0">
        <p className="truncate text-xs text-stone-500">{label}</p>
        <p className="truncate text-sm font-bold tabular-nums text-stone-900">{value}</p>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block hover:bg-stone-50">{body}</Link> : body;
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className={cx('font-semibold tabular-nums text-stone-900', strong && 'text-base font-bold')}>{value}</span>
    </div>
  );
}

function Head({ title, count, right }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900">
        {title}
        {count !== undefined && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">{count}</span>}
      </h2>
      {right}
    </div>
  );
}

export default function TodayView() {
  const { date, openForm, bump } = useDM();
  const { data: s, error, loading } = useFetch(`${API}/summary?date=${date}`);
  const { data: ex, loading: exLoading } = useFetch(`${API}/expenses?date=${date}`);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState('');
  const today = todayYmd();
  const isToday = date === today;

  async function confirmDelete() {
    setBusy(true);
    try {
      const url = del.kind === 'entry' ? `${API}/entry?date=${date}` : del.kind === 'expense' ? `${API}/expenses/${del.id}` : `${API}/deposits/${del.id}`;
      await api(url, { method: 'DELETE' });
      toast.success(del.kind === 'entry' ? 'Sales entry deleted' : del.kind === 'expense' ? 'Expense deleted' : 'Deposit deleted');
      bump();
      setDel(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function doExport(kind) {
    setExporting(kind);
    try {
      const [{ exportDaily }, exp] = await Promise.all([import('@/lib/daily-manager/export'), api(`${API}/expenses?date=${date}`)]);
      await exportDaily(kind, s, exp.items);
      toast.success('Report downloaded');
    } catch {
      toast.error('Could not create the report');
    } finally {
      setExporting('');
    }
  }

  const delText = del?.kind === 'entry' ? `The sales entry for ${prettyDate(date)} will be removed.`
    : del?.kind === 'expense' ? `${del.name} (${inr(del.cost)}) will be removed.` : 'This cannot be undone.';
  const delTitle = del?.kind === 'entry' ? 'Delete sales entry?' : del?.kind === 'expense' ? 'Delete this expense?' : 'Delete this deposit?';

  return (
    <>
      <DateBar />
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[104px]" />)}</div>
          <Skeleton className="h-16" /><Skeleton className="h-48" />
        </div>
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <>
          {s.entryMissing && date <= today && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Sales entry not filled yet</p>
                  <p className="text-sm text-amber-800">{isToday ? "Today's sales entry is missing." : `Sales for ${prettyDate(date)} are missing.`}</p>
                </div>
              </div>
              <Btn onClick={() => openForm('sales', { date, entry: null, ordersTotal: s.orders.total })}>Fill now</Btn>
            </div>
          )}

          {/* Key numbers */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label={isToday ? "Today's Sales" : 'Total Sales'} value={inr(s.sales)} sub={`Cash ${inr(s.cash)} · Online ${inr(s.online)}`} icon={IndianRupee} tone="amber" />
            <Kpi label="Total Expense" value={inr(s.expense)} sub={ex ? `${ex.items.length} ${ex.items.length === 1 ? 'item' : 'items'}` : ' '} icon={Receipt} tone="red" />
            <Kpi label="Net Profit / Loss" value={`${s.profit < 0 ? '-' : ''}${inr(Math.abs(s.profit))}`} sub={s.profit >= 0 ? 'Sales minus expenses' : 'Spent more than sold'}
              icon={s.profit >= 0 ? TrendingUp : TrendingDown} tone={s.profit >= 0 ? 'green' : 'red'} valueCls={s.profit >= 0 ? 'text-green-700' : 'text-red-700'} />
            <Kpi label="Cash in Hand" value={inr(s.cashInHandTotal)} sub="Total till this day" icon={Wallet} tone="blue" />
          </div>

          <Card className="!p-0">
            <div className="grid grid-cols-2 divide-x divide-y divide-stone-100 md:grid-cols-4 md:divide-y-0">
              <MiniStat label="Cash received" value={inr(s.cash)} icon={Banknote} />
              <MiniStat label="Online received" value={inr(s.online)} icon={Smartphone} />
              <MiniStat label="Paid website orders" value={`${s.orders.count} · ${inr(s.orders.total)}`} icon={ShoppingBag} />
              <MiniStat label="Pending tasks" value={s.pendingTasks} icon={ListTodo} href={`${BASE}/tasks`} />
            </div>
          </Card>

          {/* Sales entry + cash in hand */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <Head title="Sales entry" right={s.entry && (
                <div className="-mr-2 flex">
                  <IconBtn label="Edit sales" className="!h-9 !w-9" onClick={() => openForm('sales', { date, entry: s.entry, ordersTotal: s.orders.total })}><Pencil className="h-4 w-4" /></IconBtn>
                  <IconBtn label="Delete sales" className="!h-9 !w-9" onClick={() => setDel({ kind: 'entry' })}><Trash2 className="h-4 w-4 text-red-600" /></IconBtn>
                </div>
              )} />
              {s.entry ? (
                <div className="divide-y divide-stone-100">
                  <Row label="Total sale" value={inr(s.entry.sales)} strong />
                  <Row label="Cash" value={inr(s.entry.cash)} />
                  <Row label="Online (UPI/card)" value={inr(s.entry.online)} />
                  {Math.abs(s.entry.cash + s.entry.online - s.entry.sales) > 0.5 && (
                    <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-800">Cash + Online does not match the total. Edit to correct it.</p>
                  )}
                  {s.entry.notes && <p className="mt-2 rounded-lg bg-stone-50 p-2 text-sm text-stone-600">{s.entry.notes}</p>}
                </div>
              ) : (
                <Empty icon={IndianRupee} title="No sales entered" text="Add the day's total, cash and online amounts."
                  action={<Btn variant="soft" onClick={() => openForm('sales', { date, entry: null, ordersTotal: s.orders.total })}><Plus className="h-4 w-4" /> Add sales</Btn>} />
              )}
            </Card>

            <Card>
              <Head title="Cash in hand" />
              <p className="text-3xl font-bold tabular-nums text-stone-900">{inr(s.cashInHandTotal)}</p>
              <p className="text-xs text-stone-500">Cash sales - cash expenses - bank deposits, till this day</p>
              <div className="mt-3 divide-y divide-stone-100 border-t border-stone-100">
                <Row label="Cash sales" value={inr(s.cash)} />
                <Row label="Cash expenses" value={`- ${inr(s.expCash)}`} />
                <Row label="Bank deposits" value={`- ${inr(s.deposit)}`} />
                <Row label="This day's change" value={inr(s.cashInHand)} strong />
              </div>
            </Card>
          </div>

          {/* Paid website orders + daily expenses */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <Head title="Paid website orders" count={s.orders.count} right={<span className="text-sm font-bold tabular-nums text-red-700">{inr(s.orders.total)}</span>} />
              {s.orders.list.length ? (
                <ul className="max-h-72 divide-y divide-stone-100 overflow-y-auto">
                  {s.orders.list.map((o) => (
                    <li key={o.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-green-50 text-green-600"><ShoppingBag className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-stone-800">#{o.ref}{o.customer && ` · ${o.customer}`}</p>
                        <p className="text-xs text-stone-500">{prettyTime(o.time)}{o.mode && ` · ${o.mode}`}</p>
                      </div>
                      <span className="font-bold tabular-nums text-stone-900">{inr(o.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty icon={ShoppingBag} title="No paid orders" text="Paid orders from the website show up here." />
              )}
            </Card>

            <Card>
              <Head title="Daily expenses" count={ex ? ex.items.length : undefined}
                right={<Btn variant="soft" className="!min-h-[36px] !px-3" onClick={() => openForm('expense')}><Plus className="h-4 w-4" /> Add</Btn>} />
              {exLoading ? (
                <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
              ) : ex?.items.length ? (
                <>
                  <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">
                    <span>Total <b className="text-sm tabular-nums text-red-700">{inr(ex.total)}</b></span>
                    <span>Cash <b className="tabular-nums text-stone-900">{inr(ex.cash)}</b></span>
                    <span>Online <b className="tabular-nums text-stone-900">{inr(ex.online)}</b></span>
                  </div>
                  <ul className="max-h-72 divide-y divide-stone-100 overflow-y-auto">
                    {ex.items.map((x) => (
                      <li key={x.id} className="flex items-center gap-2 py-2.5 text-sm">
                        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: CAT_COLORS[x.category] || '#78716c' }} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-stone-800">{x.name}</p>
                          <p className="truncate text-xs text-stone-500">
                            {x.category}{x.quantity ? ` · ${x.quantity} ${x.unit}` : ''}{' · '}
                            <span className={cx('font-semibold', x.mode === 'Cash' ? 'text-green-700' : 'text-sky-700')}>{x.mode}</span>
                          </p>
                        </div>
                        <span className="font-bold tabular-nums text-stone-900">{inr(x.cost)}</span>
                        <IconBtn label="Edit expense" className="!h-9 !w-9" onClick={() => openForm('expense', x)}><Pencil className="h-4 w-4" /></IconBtn>
                        <IconBtn label="Delete expense" className="!h-9 !w-9" onClick={() => setDel({ kind: 'expense', id: x.id, name: x.name, cost: x.cost })}><Trash2 className="h-4 w-4 text-red-600" /></IconBtn>
                      </li>
                    ))}
                  </ul>
                  <Link href={`${BASE}/expenses`} className="mt-2 flex items-center justify-end gap-1 text-sm font-semibold text-red-700 hover:text-red-800">
                    View all expenses <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <Empty icon={Receipt} title="No expenses for this day" text="Add what you spent on groceries, gas, salary and more."
                  action={<Btn variant="soft" onClick={() => openForm('expense')}><Plus className="h-4 w-4" /> Add expense</Btn>} />
              )}
            </Card>
          </div>

          <Card>
            <Head title="Bank deposits" count={s.deposits.length}
              right={<Btn variant="soft" className="!min-h-[36px] !px-3" onClick={() => openForm('deposit')}><Plus className="h-4 w-4" /> Add</Btn>} />
            {s.deposits.length ? (
              <ul className="divide-y divide-stone-100">
                {s.deposits.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 py-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600"><Landmark className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold tabular-nums text-stone-900">{inr(d.amount)}</p>
                      {d.note && <p className="truncate text-sm text-stone-500">{d.note}</p>}
                    </div>
                    <IconBtn label="Edit deposit" className="!h-9 !w-9" onClick={() => openForm('deposit', d)}><Pencil className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Delete deposit" className="!h-9 !w-9" onClick={() => setDel({ kind: 'deposit', id: d.id })}><Trash2 className="h-4 w-4 text-red-600" /></IconBtn>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty icon={Landmark} title="No deposits" text="Cash you take to the bank shows here and reduces cash in hand." />
            )}
          </Card>

          <div className="flex flex-wrap gap-3">
            <Btn variant="ghost" loading={exporting === 'xlsx'} disabled={!!exporting} onClick={() => doExport('xlsx')}><FileSpreadsheet className="h-4 w-4 text-green-700" /> Daily report (Excel)</Btn>
            <Btn variant="ghost" loading={exporting === 'pdf'} disabled={!!exporting} onClick={() => doExport('pdf')}><FileDown className="h-4 w-4 text-red-700" /> Daily report (PDF)</Btn>
          </div>
        </>
      )}
      <ConfirmDialog open={!!del} busy={busy} onCancel={() => setDel(null)} onConfirm={confirmDelete} title={delTitle} text={delText} />
    </>
  );
}
