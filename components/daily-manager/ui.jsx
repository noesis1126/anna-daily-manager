// components/daily-manager/ui.jsx
'use client';
import { useEffect } from 'react';
import { AlertTriangle, Banknote, Inbox, Loader2, RefreshCw, Smartphone, X } from 'lucide-react';
import { useDM } from '@/lib/daily-manager/context';

export const cx = (...a) => a.filter(Boolean).join(' ');
export const inputCls = (err) =>
  cx(
    'w-full min-h-[46px] rounded-lg border bg-white px-3.5 text-[15px] text-stone-900 placeholder:text-stone-400 outline-none transition focus:ring-2',
    err ? 'border-red-500 focus:ring-red-200' : 'border-stone-300 focus:border-red-600 focus:ring-red-200'
  );

export function Card({ className, children, ...p }) {
  return <div className={cx('rounded-xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]', className)} {...p}>{children}</div>;
}

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-xl bg-stone-200/80', className)} />;
}

export function Empty({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-6 py-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-stone-100 text-stone-500"><Icon className="h-6 w-6" /></div>
      <p className="text-sm font-semibold text-stone-800">{title}</p>
      {text && <p className="max-w-xs text-sm text-stone-500">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorBox({ message }) {
  const { bump } = useDM();
  return (
    <Card className="flex flex-col items-center gap-3 py-8 text-center">
      <AlertTriangle className="h-8 w-8 text-red-600" />
      <p className="text-sm text-stone-700">{message || 'Could not load data.'}</p>
      <Btn variant="ghost" onClick={bump}><RefreshCw className="h-4 w-4" /> Try again</Btn>
    </Card>
  );
}

export function Btn({ variant = 'primary', className, loading, children, ...p }) {
  const v = {
    primary: 'bg-red-700 text-white shadow-sm hover:bg-red-800 active:bg-red-900',
    soft: 'bg-red-50 text-red-800 hover:bg-red-100',
    ghost: 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant];
  return (
    <button
      type="button"
      {...p}
      disabled={loading || p.disabled}
      className={cx('inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50', v, className)}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function IconBtn({ label, className, children, ...p }) {
  return (
    <button type="button" aria-label={label} title={label} {...p}
      className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-100', className)}>
      {children}
    </button>
  );
}

export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const key = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl md:max-w-lg md:rounded-2xl">
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-stone-300 md:hidden" />
        <div className="flex items-center justify-between px-5 pb-1 pt-3">
          <h2 className="text-lg font-bold text-stone-900">{title}</h2>
          <IconBtn label="Close" onClick={onClose}><X className="h-5 w-5" /></IconBtn>
        </div>
        <div className="overflow-y-auto px-5 pb-5 pt-2">{children}</div>
      </div>
    </div>
  );
}

export function SheetActions({ children }) {
  return <div className="sticky bottom-0 -mx-5 mt-5 flex flex-col gap-2 border-t border-stone-100 bg-white px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row">{children}</div>;
}

export function ConfirmDialog({ open, title = 'Delete this?', text, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const key = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-5" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 bg-stone-900/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-700"><AlertTriangle className="h-6 w-6" /></div>
        <h3 className="text-lg font-bold text-stone-900">{title}</h3>
        {text && <p className="mt-1 text-sm text-stone-600">{text}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Btn variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm} loading={busy}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, id, required, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-stone-700">
        {label}{required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
      {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function Chips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const v = o.value ?? o;
        const on = value === v;
        return (
          <button key={v} type="button" aria-pressed={on} onClick={() => onChange(v)}
            className={cx('min-h-[44px] rounded-full border px-4 text-sm font-semibold transition',
              on ? o.on || 'border-red-700 bg-red-700 text-white' : o.off || 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50')}>
            {o.label ?? o}
          </button>
        );
      })}
    </div>
  );
}

export function PayToggle({ value, onChange }) {
  const opts = [{ v: 'Cash', Icon: Banknote }, { v: 'Online', Icon: Smartphone }];
  return (
    <div className="grid grid-cols-2 gap-3">
      {opts.map(({ v, Icon }) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
          className={cx('flex min-h-[52px] items-center justify-center gap-2 rounded-lg border-2 text-sm font-bold transition',
            value === v ? 'border-red-700 bg-red-50 text-red-800' : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50')}>
          <Icon className="h-5 w-5" /> {v}
        </button>
      ))}
    </div>
  );
}

export function PageTitle({ title, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold text-stone-900 md:text-2xl">{title}</h1>
      {children}
    </div>
  );
}
