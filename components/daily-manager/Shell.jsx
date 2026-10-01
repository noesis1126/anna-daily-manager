// components/daily-manager/Shell.jsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { BarChart3, CheckSquare, LayoutDashboard, Plus, Receipt, UtensilsCrossed } from 'lucide-react';
import { DMProvider, useDM } from '@/lib/daily-manager/context';
import { BASE } from '@/lib/daily-manager/constants';
import { cx } from './ui';
import FormHost from './FormHost';

const NAV = [
  { href: BASE, label: 'Today', icon: LayoutDashboard },
  { href: `${BASE}/tasks`, label: 'Tasks', icon: CheckSquare },
  { href: `${BASE}/expenses`, label: 'Expenses', icon: Receipt },
  { href: `${BASE}/reports`, label: 'Reports', icon: BarChart3 },
];

function Frame({ children }) {
  const path = usePathname() || '';
  const { openForm } = useDM();
  const active = (href) => (href === BASE ? path === BASE : path.startsWith(href));
  const current = NAV.find((n) => active(n.href)) || NAV[0];

  const onTasks = path.startsWith(`${BASE}/tasks`);
  const onExpenses = path.startsWith(`${BASE}/expenses`);
  const onReports = path.startsWith(`${BASE}/reports`);
  const addLabel = onTasks ? 'Add task' : onExpenses ? 'Add expense' : 'Quick add';
  const add = () => openForm(onTasks ? 'task' : onExpenses ? 'expense' : 'quick');

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <Toaster position="top-center" toastOptions={{ duration: 2500, style: { borderRadius: '10px', fontWeight: 600, fontSize: '14px' } }} />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-stone-200 bg-white md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-700 text-white shadow-sm"><UtensilsCrossed className="h-5 w-5" /></div>
          <div className="leading-tight">
            <p className="text-[15px] font-bold text-stone-900">Daily Manager</p>
            <p className="text-xs text-stone-500">Anna Chinese Restaurant</p>
          </div>
        </div>
        <p className="px-5 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Menu</p>
        <nav className="flex flex-col gap-0.5 px-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cx('flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-semibold transition',
                active(href) ? 'bg-red-50 text-red-800' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900')}>
              <Icon className={cx('h-[18px] w-[18px]', active(href) ? 'text-red-700' : 'text-stone-400')} /> {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:h-16 md:px-8">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-700 text-white md:hidden"><UtensilsCrossed className="h-4 w-4" /></div>
              <div className="leading-tight">
                <p className="text-base font-bold text-stone-900 md:text-lg">{current.label}</p>
                <p className="text-[11px] text-stone-500 md:hidden">Anna Chinese Restaurant</p>
              </div>
            </div>
            {!onReports && (
              <button type="button" onClick={add}
                className="hidden min-h-[40px] items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 md:inline-flex">
                <Plus className="h-4 w-4" /> {addLabel}
              </button>
            )}
          </div>
        </header>

        <main className="pb-28 md:pb-10">
          <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8 md:py-7">{children}</div>
        </main>
      </div>

      {/* Mobile floating add */}
      {!onReports && (
        <button type="button" onClick={add} aria-label={addLabel}
          className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-red-700 text-white shadow-lg shadow-red-900/25 active:scale-95 md:hidden">
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cx('flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold',
              active(href) ? 'text-red-700' : 'text-stone-500')}>
            <Icon className="h-5 w-5" /> {label}
          </Link>
        ))}
      </nav>

      <FormHost />
    </div>
  );
}

export default function Shell({ children }) {
  return (
    <DMProvider>
      <Frame>{children}</Frame>
    </DMProvider>
  );
}
