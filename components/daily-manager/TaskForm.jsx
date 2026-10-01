// components/daily-manager/TaskForm.jsx
'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Repeat } from 'lucide-react';
import { Btn, Chips, Field, Sheet, SheetActions, cx, inputCls } from './ui';
import { useDM } from '@/lib/daily-manager/context';
import { api } from '@/lib/daily-manager/api';
import { API } from '@/lib/daily-manager/constants';
import { fieldErrors, taskSchema, validate } from '@/lib/daily-manager/schemas';

const PRIORITY = [
  { value: 'low', label: 'Low', on: 'border-green-600 bg-green-600 text-white', off: 'border-green-300 bg-green-50 text-green-700' },
  { value: 'medium', label: 'Medium', on: 'border-amber-500 bg-amber-500 text-white', off: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'high', label: 'High', on: 'border-red-600 bg-red-600 text-white', off: 'border-red-300 bg-red-50 text-red-700' },
];

export default function TaskForm({ data, onClose }) {
  const { date, bump } = useDM();
  const edit = !!data?.id;
  const tpl = !!data?.isTemplate;
  const [v, setV] = useState({
    title: data?.title || '', note: data?.note || '', priority: data?.priority || 'medium', dueTime: data?.dueTime || '',
    assignedTo: data?.assignedTo || '', date: data?.date || date, status: data?.status === 'done' ? 'done' : 'pending', recurring: false,
  });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (val) => setV((s) => ({ ...s, [k]: val }));
  const on = (k) => (e) => set(k)(e.target.value);

  async function submit(e) {
    e.preventDefault();
    const { data: d, errors } = validate(taskSchema, v);
    setErr(errors);
    if (!d) return;
    setSaving(true);
    try {
      await api(edit ? `${API}/tasks/${data.id}` : `${API}/tasks`, { method: edit ? 'PATCH' : 'POST', body: d });
      toast.success(edit ? 'Task updated' : v.recurring ? 'Daily task added' : 'Task added');
      bump();
      onClose();
    } catch (x) {
      if (x.fields) setErr(fieldErrors(x.fields));
      toast.error(x.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open onClose={onClose} title={tpl ? 'Edit daily task' : edit ? 'Edit task' : 'Add task'}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Task" id="t-title" required error={err.title}>
          <input id="t-title" autoFocus className={inputCls(err.title)} placeholder="e.g. Clean the kitchen" value={v.title} onChange={on('title')} />
        </Field>
        <Field label="Priority" required error={err.priority}>
          <Chips options={PRIORITY} value={v.priority} onChange={set('priority')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due time" id="t-time" error={err.dueTime}>
            <input id="t-time" type="time" className={inputCls(err.dueTime)} value={v.dueTime} onChange={on('dueTime')} />
          </Field>
          {!tpl && (
            <Field label="Date" id="t-date" required error={err.date}>
              <input id="t-date" type="date" className={inputCls(err.date)} value={v.date} onChange={on('date')} />
            </Field>
          )}
        </div>
        <Field label="Assigned to" id="t-who" error={err.assignedTo} hint="Optional">
          <input id="t-who" className={inputCls(err.assignedTo)} placeholder="e.g. Ramesh" value={v.assignedTo} onChange={on('assignedTo')} />
        </Field>
        <Field label="Note" id="t-note" error={err.note} hint="Optional">
          <textarea id="t-note" rows={2} className={cx(inputCls(err.note), 'py-3')} placeholder="e.g. Check the gas pipe too" value={v.note} onChange={on('note')} />
        </Field>
        {edit && !tpl && (
          <Field label="Status">
            <Chips options={[{ value: 'pending', label: 'Pending' }, { value: 'done', label: 'Done', on: 'border-green-600 bg-green-600 text-white' }]} value={v.status} onChange={set('status')} />
          </Field>
        )}
        {!edit && (
          <button type="button" onClick={() => set('recurring')(!v.recurring)} aria-pressed={v.recurring}
            className={cx('flex min-h-[56px] w-full items-center gap-3 rounded-xl border-2 px-4 text-left transition',
              v.recurring ? 'border-red-700 bg-red-50' : 'border-stone-300 bg-white')}>
            <Repeat className={cx('h-5 w-5', v.recurring ? 'text-red-700' : 'text-stone-500')} />
            <span className="flex-1"><span className="block text-base font-bold text-stone-800">Repeat every day</span>
              <span className="block text-xs text-stone-500">Shows up automatically each morning</span></span>
            <span className={cx('h-6 w-11 rounded-full p-0.5 transition', v.recurring ? 'bg-red-700' : 'bg-stone-300')}>
              <span className={cx('block h-5 w-5 rounded-full bg-white transition', v.recurring && 'translate-x-5')} />
            </span>
          </button>
        )}
        <SheetActions>
          <Btn type="submit" loading={saving} className="flex-1">{saving ? 'Saving…' : edit ? 'Save changes' : 'Add task'}</Btn>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Cancel</Btn>
        </SheetActions>
      </form>
    </Sheet>
  );
}
