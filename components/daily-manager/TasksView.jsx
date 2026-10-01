// components/daily-manager/TasksView.jsx
'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckSquare, Check, ChevronDown, Clock, Pencil, Plus, Repeat, Trash2, User } from 'lucide-react';
import { useDM } from '@/lib/daily-manager/context';
import { useFetch } from '@/lib/daily-manager/useFetch';
import { api } from '@/lib/daily-manager/api';
import { API } from '@/lib/daily-manager/constants';
import { shortDate, time12 } from '@/lib/daily-manager/dates';
import DateBar from './DateBar';
import { Btn, Card, ConfirmDialog, Empty, ErrorBox, IconBtn, PageTitle, Skeleton, cx } from './ui';

const PRI = {
  high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700',
};

function TaskRow({ t, carried, onToggle, onEdit, onDelete }) {
  const done = t.status === 'done';
  return (
    <div className={cx('flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-3', done && 'opacity-60')}>
      <button type="button" onClick={() => onToggle(t)} aria-label={done ? 'Mark as pending' : 'Mark as done'}
        className={cx('mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 transition active:scale-95',
          done ? 'border-green-600 bg-green-600 text-white' : 'border-stone-300 text-transparent hover:border-red-600')}>
        <Check className="h-6 w-6" />
      </button>
      <div className="min-w-0 flex-1 py-1">
        <p className={cx('break-words text-base font-semibold text-stone-900', done && 'line-through')}>{t.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <span className={cx('rounded-full px-2.5 py-1 capitalize', PRI[t.priority])}>{t.priority}</span>
          {carried && <span className="rounded-full bg-amber-500 px-2.5 py-1 text-white">Carried over · {shortDate(t.date)}</span>}
          {t.dueTime && <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-stone-600"><Clock className="h-3 w-3" />{time12(t.dueTime)}</span>}
          {t.assignedTo && <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-stone-600"><User className="h-3 w-3" />{t.assignedTo}</span>}
          {t.templateId && <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-stone-600"><Repeat className="h-3 w-3" />Daily</span>}
        </div>
        {t.note && <p className="mt-1.5 text-sm text-stone-500">{t.note}</p>}
      </div>
      <div className="flex shrink-0">
        <IconBtn label="Edit task" onClick={() => onEdit(t)}><Pencil className="h-5 w-5" /></IconBtn>
        <IconBtn label="Delete task" onClick={() => onDelete(t)}><Trash2 className="h-5 w-5 text-red-600" /></IconBtn>
      </div>
    </div>
  );
}

export default function TasksView() {
  const { date, openForm, bump } = useDM();
  const { data, error, loading, setData } = useFetch(`${API}/tasks?date=${date}`);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showTpl, setShowTpl] = useState(false);

  async function toggle(t) {
    const next = t.status === 'done' ? 'pending' : 'done';
    setData((d) => d && {
      ...d,
      today: d.today.map((x) => (x.id === t.id ? { ...x, status: next } : x)),
      carried: next === 'done' ? d.carried.filter((x) => x.id !== t.id) : d.carried,
    });
    try {
      await api(`${API}/tasks/${t.id}`, { method: 'PATCH', body: { status: next } });
      toast.success(next === 'done' ? 'Marked as done' : 'Moved back to pending');
    } catch (e) {
      toast.error(e.message);
    } finally {
      bump();
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await api(`${API}/tasks/${del.id}`, { method: 'DELETE' });
      toast.success(del.isTemplate ? 'Daily task stopped' : 'Task deleted');
      setDel(null);
      bump();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const pendingToday = data ? data.today.filter((t) => t.status === 'pending').length : 0;
  return (
    <>
      <PageTitle title="Tasks">
        <Btn className="hidden md:inline-flex" onClick={() => openForm('task')}><Plus className="h-5 w-5" /> Add task</Btn>
      </PageTitle>
      <DateBar />
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-base font-bold text-stone-800">Today <span className="font-medium text-stone-500">· {pendingToday} pending of {data.today.length}</span></h2>
            {data.today.length ? (
              data.today.map((t) => <TaskRow key={t.id} t={t} onToggle={toggle} onEdit={(x) => openForm('task', x)} onDelete={setDel} />)
            ) : (
              <Empty icon={CheckSquare} title="No tasks for this day" text="Add a task or set up a daily one like 'Check gas'."
                action={<Btn variant="soft" onClick={() => openForm('task')}><Plus className="h-4 w-4" /> Add task</Btn>} />
            )}
          </section>

          {data.carried.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-bold text-stone-800">Pending from earlier days <span className="font-medium text-stone-500">· {data.carried.length}</span></h2>
              {data.carried.map((t) => <TaskRow key={t.id} t={t} carried onToggle={toggle} onEdit={(x) => openForm('task', x)} onDelete={setDel} />)}
            </section>
          )}

          <Card className="!p-0">
            <button type="button" onClick={() => setShowTpl((x) => !x)} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left">
              <Repeat className="h-5 w-5 text-red-700" />
              <span className="flex-1 text-base font-bold text-stone-800">Daily recurring tasks <span className="font-medium text-stone-500">· {data.templates.length}</span></span>
              <ChevronDown className={cx('h-5 w-5 text-stone-500 transition', showTpl && 'rotate-180')} />
            </button>
            {showTpl && (
              <div className="space-y-2 border-t border-stone-100 p-3">
                {data.templates.length ? data.templates.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-xl bg-stone-50 p-2 pl-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-stone-800">{t.title}</p>
                      <p className="text-xs text-stone-500">{t.dueTime ? time12(t.dueTime) : 'Any time'}{t.assignedTo && ` · ${t.assignedTo}`}</p>
                    </div>
                    <IconBtn label="Edit daily task" onClick={() => openForm('task', t)}><Pencil className="h-5 w-5" /></IconBtn>
                    <IconBtn label="Stop daily task" onClick={() => setDel(t)}><Trash2 className="h-5 w-5 text-red-600" /></IconBtn>
                  </div>
                )) : <p className="py-3 text-center text-sm text-stone-500">Turn on "Repeat every day" when adding a task.</p>}
              </div>
            )}
          </Card>
        </>
      )}
      <ConfirmDialog open={!!del} busy={busy} onCancel={() => setDel(null)} onConfirm={confirmDelete}
        title={del?.isTemplate ? 'Stop this daily task?' : 'Delete this task?'} confirmLabel={del?.isTemplate ? 'Stop task' : 'Delete'}
        text={del?.isTemplate ? 'It will no longer appear each day. Unfinished copies are removed; finished ones stay.'
          : del?.templateId ? 'This removes it for this day only. To stop it for good, use Daily recurring tasks.' : 'This cannot be undone.'} />
    </>
  );
}
