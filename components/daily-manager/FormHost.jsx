// components/daily-manager/FormHost.jsx
'use client';
import { CheckSquare, IndianRupee, Landmark, Receipt } from 'lucide-react';
import { useDM } from '@/lib/daily-manager/context';
import { Sheet } from './ui';
import TaskForm from './TaskForm';
import ExpenseForm from './ExpenseForm';
import SalesForm from './SalesForm';
import DepositForm from './DepositForm';

export default function FormHost() {
  const { form, closeForm, openForm } = useDM();
  if (!form) return null;
  const { type, data } = form;
  if (type === 'task') return <TaskForm data={data} onClose={closeForm} />;
  if (type === 'expense') return <ExpenseForm data={data} onClose={closeForm} />;
  if (type === 'sales') return <SalesForm data={data} onClose={closeForm} />;
  if (type === 'deposit') return <DepositForm data={data} onClose={closeForm} />;
  const items = [
    { t: 'expense', label: 'Add expense', Icon: Receipt },
    { t: 'sales', label: 'Sales entry', Icon: IndianRupee },
    { t: 'task', label: 'Add task', Icon: CheckSquare },
    { t: 'deposit', label: 'Bank deposit', Icon: Landmark },
  ];
  return (
    <Sheet open onClose={closeForm} title="Quick add">
      <div className="grid grid-cols-2 gap-3 pb-2">
        {items.map(({ t, label, Icon }) => (
          <button key={t} type="button" onClick={() => openForm(t)}
            className="flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 text-base font-bold text-red-800 active:scale-95">
            <Icon className="h-7 w-7" /> {label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
