// lib/daily-manager/recurring.js  (server only)
import Task from '@/models/daily-manager/Task';
import { dateToYmd, todayYmd, ymdToDate } from './dates';

// Creates the day's copy of every recurring task (once per day, safe to call repeatedly).
export async function ensureRecurring(ymd) {
  if (ymd > todayYmd()) return;
  const templates = await Task.find({ isTemplate: true }).lean();
  const day = ymdToDate(ymd);
  await Promise.allSettled(
    templates
      .filter((t) => dateToYmd(t.date) <= ymd)
      .map((t) =>
        Task.updateOne(
          { templateId: t._id, date: day },
          { $setOnInsert: { title: t.title, note: t.note, priority: t.priority, dueTime: t.dueTime, assignedTo: t.assignedTo, status: 'pending', isTemplate: false } },
          { upsert: true }
        )
      )
  );
}
