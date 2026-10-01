// components/daily-manager/DateBar.jsx
'use client';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDM } from '@/lib/daily-manager/context';
import { addDays, prettyDate, todayYmd } from '@/lib/daily-manager/dates';
import { IconBtn } from './ui';

export default function DateBar() {
  const { date, setDate } = useDM();
  const today = todayYmd();
  return (
    <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-1.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <IconBtn label="Previous day" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="h-5 w-5" /></IconBtn>
      <label className="relative flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-1.5 hover:bg-stone-50">
        <CalendarDays className="h-4 w-4 shrink-0 text-red-700" />
        <span className="truncate text-sm font-bold text-stone-900">{prettyDate(date)}</span>
        {date === today && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">Today</span>}
        <input type="date" aria-label="Pick a date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      <IconBtn label="Next day" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="h-5 w-5" /></IconBtn>
      {date !== today && (
        <button type="button" onClick={() => setDate(today)}
          className="min-h-[44px] rounded-lg bg-red-50 px-4 text-sm font-bold text-red-800 hover:bg-red-100">Today</button>
      )}
    </div>
  );
}
