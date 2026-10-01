// components/daily-manager/DepositForm.jsx
'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Btn, Field, Sheet, SheetActions, cx, inputCls } from './ui';
import { useDM } from '@/lib/daily-manager/context';
import { api } from '@/lib/daily-manager/api';
import { API } from '@/lib/daily-manager/constants';
import { depositSchema, fieldErrors, validate } from '@/lib/daily-manager/schemas';

export default function DepositForm({ data, onClose }) {
  const { date, bump } = useDM();
  const edit = !!data?.id;
  const [v, setV] = useState({ amount: data?.amount ?? '', date: data?.date || date, note: data?.note || '' });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const on = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const { data: d, errors } = validate(depositSchema, v);
    setErr(errors);
    if (!d) return;
    setSaving(true);
    try {
      await api(edit ? `${API}/deposits/${data.id}` : `${API}/deposits`, { method: edit ? 'PATCH' : 'POST', body: d });
      toast.success(edit ? 'Deposit updated' : 'Deposit saved');
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
    <Sheet open onClose={onClose} title={edit ? 'Edit bank deposit' : 'Bank deposit'}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Amount (₹)" id="d-amt" required error={err.amount}>
          <input id="d-amt" inputMode="decimal" autoFocus className={inputCls(err.amount)} placeholder="e.g. 10000" value={v.amount} onChange={on('amount')} />
        </Field>
        <Field label="Date" id="d-date" required error={err.date}>
          <input id="d-date" type="date" className={inputCls(err.date)} value={v.date} onChange={on('date')} />
        </Field>
        <Field label="Note" id="d-note" error={err.note} hint="Optional">
          <textarea id="d-note" rows={2} className={cx(inputCls(err.note), 'py-3')} placeholder="e.g. Deposited at SBI branch" value={v.note} onChange={on('note')} />
        </Field>
        <SheetActions>
          <Btn type="submit" loading={saving} className="flex-1">{saving ? 'Saving…' : edit ? 'Save changes' : 'Save deposit'}</Btn>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Cancel</Btn>
        </SheetActions>
      </form>
    </Sheet>
  );
}
