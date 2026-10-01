// components/daily-manager/SalesForm.jsx
'use client';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import { Btn, Field, Sheet, SheetActions, cx, inputCls } from './ui';
import { useDM } from '@/lib/daily-manager/context';
import { api } from '@/lib/daily-manager/api';
import { API } from '@/lib/daily-manager/constants';
import { dailyEntrySchema, fieldErrors, validate } from '@/lib/daily-manager/schemas';
import { inr } from '@/lib/daily-manager/format';

const num = (s) => (s === '' || s == null || Number.isNaN(Number(s)) ? null : Number(s));
const str = (x) => String(Math.round(x * 100) / 100);

export default function SalesForm({ data, onClose }) {
  const { date, bump } = useDM();
  const startDate = data?.date || date;
  const e0 = data?.entry;
  const [v, setV] = useState({
    date: startDate,
    total: e0 ? String(e0.sales) : '',
    cash: e0 ? String(e0.cash) : '',
    online: e0 ? String(e0.online) : '',
    notes: e0?.notes || '',
  });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const first = useRef(true);

  // switching the date loads that day's existing entry (so it is edited, not overwritten blindly)
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    let live = true;
    api(`${API}/entry?date=${v.date}`).then(({ entry }) => {
      if (!live) return;
      setV((s) => ({ ...s, total: entry ? String(entry.sales) : '', cash: entry ? String(entry.cash) : '', online: entry ? String(entry.online) : '', notes: entry?.notes || '' }));
    }).catch(() => {});
    return () => { live = false; };
  }, [v.date]);

  function change(k, val) {
    setV((s) => {
      const nx = { ...s, [k]: val };
      const t = num(nx.total), c = num(nx.cash), o = num(nx.online);
      if (k === 'total' && t !== null) {
        if (c !== null) nx.online = str(Math.max(t - c, 0));
        else if (o !== null) nx.cash = str(Math.max(t - o, 0));
      } else if (k === 'cash' && t !== null && c !== null) nx.online = str(Math.max(t - c, 0));
      else if (k === 'online' && t !== null && o !== null) nx.cash = str(Math.max(t - o, 0));
      return nx;
    });
  }

  const t = num(v.total), c = num(v.cash) || 0, o = num(v.online) || 0;
  const mismatch = t !== null && Math.abs(c + o - t) > 0.5;

  async function submit(e) {
    e.preventDefault();
    const { data: d, errors } = validate(dailyEntrySchema, { date: v.date, sales: v.total, cash: v.cash, online: v.online, notes: v.notes });
    setErr({ ...errors, total: errors.sales });
    if (!d) return;
    setSaving(true);
    try {
      await api(`${API}/entry`, { method: 'POST', body: d });
      toast.success('Sales saved');
      bump();
      onClose();
    } catch (x) {
      if (x.fields) { const f = fieldErrors(x.fields); setErr({ ...f, total: f.sales }); }
      toast.error(x.message);
    } finally {
      setSaving(false);
    }
  }

  const showOrders = data?.ordersTotal > 0 && v.date === startDate;
  return (
    <Sheet open onClose={onClose} title={e0 ? 'Edit sales' : 'Sales entry'}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Date" id="s-date" required error={err.date}>
          <input id="s-date" type="date" className={inputCls(err.date)} value={v.date} onChange={(e) => setV((s) => ({ ...s, date: e.target.value }))} />
        </Field>
        <Field label="Total sale (₹)" id="s-total" required error={err.total}
          hint={showOrders ? undefined : 'Enter the total, then the cash part. Online fills in by itself.'}>
          <input id="s-total" inputMode="decimal" autoFocus className={inputCls(err.total)} placeholder="e.g. 12500" value={v.total} onChange={(e) => change('total', e.target.value)} />
        </Field>
        {showOrders && (
          <button type="button" onClick={() => change('total', str(data.ordersTotal))} className="-mt-2 text-sm font-semibold text-red-700 underline">
            Website paid orders today: {inr(data.ordersTotal)}. Use as total
          </button>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cash (₹)" id="s-cash" error={err.cash}>
            <input id="s-cash" inputMode="decimal" className={inputCls(err.cash)} placeholder="e.g. 7000" value={v.cash} onChange={(e) => change('cash', e.target.value)} />
          </Field>
          <Field label="Online / UPI / card (₹)" id="s-online" error={err.online}>
            <input id="s-online" inputMode="decimal" className={inputCls(err.online)} placeholder="e.g. 5500" value={v.online} onChange={(e) => change('online', e.target.value)} />
          </Field>
        </div>
        {mismatch && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Cash + Online is {inr(c + o)}, but the total is {inr(t)}. Check the amounts.</span>
          </div>
        )}
        <Field label="Notes" id="s-notes" error={err.notes} hint="Optional">
          <textarea id="s-notes" rows={2} className={cx(inputCls(err.notes), 'py-3')} placeholder="e.g. Wedding party order in the evening" value={v.notes} onChange={(e) => setV((s) => ({ ...s, notes: e.target.value }))} />
        </Field>
        <SheetActions>
          <Btn type="submit" loading={saving} className="flex-1">{saving ? 'Saving…' : 'Save sales'}</Btn>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Cancel</Btn>
        </SheetActions>
      </form>
    </Sheet>
  );
}
