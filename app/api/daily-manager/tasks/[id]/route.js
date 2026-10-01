// app/api/daily-manager/tasks/[id]/route.js
import Task from '@/models/daily-manager/Task';
import { fail, handler, ok, ser } from '@/lib/daily-manager/http';
import { taskPatchSchema } from '@/lib/daily-manager/schemas';
import { ymdToDate } from '@/lib/daily-manager/dates';

export const dynamic = 'force-dynamic';

export const GET = handler(async (_req, ctx) => {
  const { id } = await ctx.params;
  const doc = await Task.findById(id);
  return doc ? ok(ser(doc)) : fail('Task not found', 404);
});

export const PATCH = handler(async (req, ctx) => {
  const { id } = await ctx.params;
  const { date, ...rest } = taskPatchSchema.parse(await req.json());
  const doc = await Task.findById(id);
  if (!doc) return fail('Task not found', 404);
  doc.set(rest);
  if (date) doc.date = ymdToDate(date);
  if (rest.status === 'done') doc.doneAt = new Date();
  else if (rest.status) doc.doneAt = undefined;
  await doc.save();
  return ok(ser(doc));
});

export const DELETE = handler(async (_req, ctx) => {
  const { id } = await ctx.params;
  const doc = await Task.findById(id);
  if (!doc) return fail('Task not found', 404);
  if (doc.isTemplate) {
    // stop the recurring task: remove template and its unfinished copies (finished ones stay as history)
    await Task.deleteMany({ templateId: doc._id, status: { $in: ['pending', 'skipped'] } });
    await doc.deleteOne();
  } else if (doc.templateId) {
    doc.status = 'skipped'; // keep a marker so the recurring task does not re-create itself for this day
    await doc.save();
  } else {
    await doc.deleteOne();
  }
  return ok({ deleted: true });
});
