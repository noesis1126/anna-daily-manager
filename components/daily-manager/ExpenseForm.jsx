// components/daily-manager/ExpenseForm.jsx
'use client';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Btn, Chips, Field, PayToggle, Sheet, SheetActions, cx, inputCls } from './ui';
import { useDM } from '@/lib/daily-manager/context';
import { api } from '@/lib/daily-manager/api';
import { API, CATEGORIES, UNITS } from '@/lib/daily-manager/constants';
import { expenseSchema, fieldErrors, validate } from '@/lib/daily-manager/schemas';
import { ls } from '@/lib/daily-manager/storage';

export default function ExpenseForm({ data, onClose }) {
  const { date, bump } = useDM();
  const edit = !!data?.id;
  const nameRef = useRef(null);
  const [v, setV] = useState({
    name: data?.name || '',
    category: data?.category || ls.get('dm:lastCategory', ''),
    quantity: data?.quantity ?? '',
    unit: data?.unit || '',
    cost: data?.cost ?? '',
    mode: data?.mode || ls.get('dm:lastMode', 'Cash'),
    date: data?.date || date,
    note: data?.note || '',
  });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(null); // 'save' | 'again' | null
  const set = (k) => (val) => setV((s) => ({ ...s, [k]: val }));
  const on = (k) => (e) => set(k)(e.target.value);

  async function submit(again) {
    const { data: d, errors } = validate(expenseSchema, v);
    setErr(errors);
    if (!d) return;
    setSaving(again ? 'again' : 'save');
    try {
      await api(edit ? `${API}/expenses/${data.id}` : `${API}/expenses`, { method: edit ? 'PATCH' : 'POST', body: d });
      ls.set('dm:lastCategory', d.category);
      ls.set('dm:lastMode', d.mode);
      toast.success(edit ? 'Expense updated' : 'Expense saved');
      bump();
      if (again) {
        setV((s) => ({ ...s, name: '', quantity: '', unit: '', cost: '', note: '' }));
        setErr({});
        nameRef.current?.focus();
      } else onClose();
    } catch (x) {
      if (x.fields) setErr(fieldErrors(x.fields));
      toast.error(x.message);
    } finally {
      setSaving(null);
    }
  }

  const busy = !!saving;
  return (
    <Sheet open onClose={onClose} title={edit ? 'Edit expense' : 'Add expense'}>
      <form onSubmit={(e) => { e.preventDefault(); submit(false); }} noValidate className="space-y-4">
        <Field label="Item name" id="e-name" required error={err.name}>
          <input id="e-name" ref={nameRef} autoFocus className={inputCls(err.name)} placeholder="e.g. Onions" value={v.name} onChange={on('name')} />
        </Field>
        <Field label="Category" required error={err.category}>
          <Chips options={CATEGORIES} value={v.category} onChange={set('category')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity" id="e-qty" error={err.quantity} hint="Optional">
            <input id="e-qty" inputMode="decimal" className={inputCls(err.quantity)} placeholder="e.g. 5" value={v.quantity} onChange={on('quantity')} />
          </Field>
          <Field label="Cost (₹)" id="e-cost" required error={err.cost}>
            <input id="e-cost" inputMode="decimal" className={inputCls(err.cost)} placeholder="e.g. 250" value={v.cost} onChange={on('cost')} />
          </Field>
        </div>
        <Field label="Unit" error={err.unit}>
          <Chips options={UNITS} value={v.unit} onChange={(u) => set('unit')(v.unit === u ? '' : u)} />
        </Field>
        <Field label="Paid by" required error={err.mode}>
          <PayToggle value={v.mode} onChange={set('mode')} />
        </Field>
        <Field label="Date" id="e-date" required error={err.date}>
          <input id="e-date" type="date" className={inputCls(err.date)} value={v.date} onChange={on('date')} />
        </Field>
        <Field label="Note" id="e-note" error={err.note} hint="Optional">
          <textarea id="e-note" rows={2} className={cx(inputCls(err.note), 'py-3')} placeholder="e.g. Bought from the market" value={v.note} onChange={on('note')} />
        </Field>
        <SheetActions>
          <Btn type="submit" loading={saving === 'save'} disabled={busy} className="flex-1">{saving === 'save' ? 'Saving…' : edit ? 'Save changes' : 'Save expense'}</Btn>
          {!edit && (
            <Btn variant="soft" onClick={() => submit(true)} loading={saving === 'again'} disabled={busy} className="flex-1">Save and add another</Btn>
          )}
        </SheetActions>
      </form>
    </Sheet>
  );
}
