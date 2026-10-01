// components/daily-manager/ExpensesView.jsx
'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, Pencil, Plus, Receipt, Smartphone, Trash2 } from 'lucide-react';
import { useDM } from '@/lib/daily-manager/context';
import { useFetch } from '@/lib/daily-manager/useFetch';
import { api } from '@/lib/daily-manager/api';
import { API, CAT_COLORS } from '@/lib/daily-manager/constants';
import { inr } from '@/lib/daily-manager/format';
import DateBar from './DateBar';
import CategoryBreakdown from './CategoryBreakdown';
import { Btn, Card, ConfirmDialog, Empty, ErrorBox, IconBtn, PageTitle, Skeleton, cx } from './ui';

export default function ExpensesView() {
  const { date, openForm, bump } = useDM();
  const { data, error, loading } = useFetch(`${API}/expenses?date=${date}`);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    setBusy(true);
    try {
      await api(`${API}/expenses/${del.id}`, { method: 'DELETE' });
      toast.success('Expense deleted');
      setDel(null);
      bump();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle title="Expenses">
        <Btn className="hidden md:inline-flex" onClick={() => openForm('expense')}><Plus className="h-5 w-5" /> Add expense</Btn>
      </PageTitle>
      <DateBar />
      {loading ? (
        <div className="space-y-3"><div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div><Skeleton className="h-56" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="!p-3"><p className="text-xs font-medium text-stone-500">Total spent</p><p className="mt-1 text-lg font-bold text-red-700">{inr(data.total)}</p></Card>
            <Card className="!p-3"><p className="flex items-center gap-1 text-xs font-medium text-stone-500"><Banknote className="h-3.5 w-3.5" />Cash</p><p className="mt-1 text-lg font-bold text-stone-900">{inr(data.cash)}</p></Card>
            <Card className="!p-3"><p className="flex items-center gap-1 text-xs font-medium text-stone-500"><Smartphone className="h-3.5 w-3.5" />Online</p><p className="mt-1 text-lg font-bold text-stone-900">{inr(data.online)}</p></Card>
          </div>

          <Card>
            <h2 className="mb-3 text-base font-bold text-stone-900">Spending by category</h2>
            <CategoryBreakdown data={data.categories} />
          </Card>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-stone-800">Items <span className="font-medium text-stone-500">· {data.items.length}</span></h2>
            {data.items.length ? data.items.map((x) => (
              <div key={x.id} className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-3 pl-4">
                <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: CAT_COLORS[x.category] }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-stone-900">{x.name}</p>
                  <p className="truncate text-xs text-stone-500">
                    {x.category}{x.quantity ? ` · ${x.quantity} ${x.unit}` : ''}
                    {' · '}<span className={cx('font-semibold', x.mode === 'Cash' ? 'text-green-700' : 'text-sky-700')}>{x.mode}</span>
                  </p>
                  {x.note && <p className="truncate text-xs text-stone-400">{x.note}</p>}
                </div>
                <p className="text-base font-bold text-stone-900">{inr(x.cost)}</p>
                <IconBtn label="Edit expense" onClick={() => openForm('expense', x)}><Pencil className="h-5 w-5" /></IconBtn>
                <IconBtn label="Delete expense" onClick={() => setDel(x)}><Trash2 className="h-5 w-5 text-red-600" /></IconBtn>
              </div>
            )) : (
              <Empty icon={Receipt} title="No expenses for this day" text="Add what you spent on groceries, gas, salary and more."
                action={<Btn variant="soft" onClick={() => openForm('expense')}><Plus className="h-4 w-4" /> Add expense</Btn>} />
            )}
          </section>
        </>
      )}
      <ConfirmDialog open={!!del} busy={busy} onCancel={() => setDel(null)} onConfirm={confirmDelete}
        title="Delete this expense?" text={del ? `${del.name} (${inr(del.cost)}) will be removed.` : ''} />
    </>
  );
}
