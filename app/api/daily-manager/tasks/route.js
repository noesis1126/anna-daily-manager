// app/api/daily-manager/tasks/route.js
import Task from '@/models/daily-manager/Task';
import { handler, ok, qs, ser } from '@/lib/daily-manager/http';
import { taskSchema, ymd } from '@/lib/daily-manager/schemas';
import { todayYmd, ymdToDate } from '@/lib/daily-manager/dates';
import { ensureRecurring } from '@/lib/daily-manager/recurring';

export const dynamic = 'force-dynamic';

const W = { high: 0, medium: 1, low: 2 };
const sortTasks = (a, b) =>
  (a.status === 'done') - (b.status === 'done') ||
  W[a.priority] - W[b.priority] ||
  (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99');

// GET /api/daily-manager/tasks?date=YYYY-MM-DD -> { today, carried, templates }
export const GET = handler(async (req) => {
  const date = ymd.parse(qs(req, 'date') || todayYmd());
  const day = ymdToDate(date);
  await ensureRecurring(date);
  const [t, c, tpl] = await Promise.all([
    Task.find({ date: day, isTemplate: false, status: { $ne: 'skipped' } }).lean(),
    Task.find({ date: { $lt: day }, isTemplate: false, status: 'pending' }).lean(),
    Task.find({ isTemplate: true }).sort({ createdAt: 1 }).lean(),
  ]);
  return ok({
    date,
    today: t.map(ser).sort(sortTasks),
    carried: c.map(ser).sort((a, b) => a.date.localeCompare(b.date) || sortTasks(a, b)),
    templates: tpl.map(ser),
  });
});

export const POST = handler(async (req) => {
  const { recurring, date, ...rest } = taskSchema.parse(await req.json());
  const doc = await Task.create({
    ...rest,
    status: recurring ? 'pending' : rest.status,
    date: ymdToDate(date),
    isTemplate: recurring,
    doneAt: !recurring && rest.status === 'done' ? new Date() : undefined,
  });
  return ok(ser(doc), 201);
});
