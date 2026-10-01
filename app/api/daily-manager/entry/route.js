// app/api/daily-manager/entry/route.js  (daily sales entry, one per date)
import DailyEntry from '@/models/daily-manager/DailyEntry';
import { fail, handler, ok, qs, ser } from '@/lib/daily-manager/http';
import { dailyEntrySchema, ymd } from '@/lib/daily-manager/schemas';
import { todayYmd, ymdToDate } from '@/lib/daily-manager/dates';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  const date = ymd.parse(qs(req, 'date') || todayYmd());
  const doc = await DailyEntry.findOne({ date: ymdToDate(date) }).lean();
  return ok({ date, entry: doc ? ser(doc) : null });
});

// create or update (upsert by date)
export const POST = handler(async (req) => {
  const { date, ...d } = dailyEntrySchema.parse(await req.json());
  const doc = await DailyEntry.findOneAndUpdate(
    { date: ymdToDate(date) },
    { $set: d },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return ok(ser(doc), 201);
});
export const PUT = POST;

export const DELETE = handler(async (req) => {
  const date = ymd.parse(qs(req, 'date'));
  const doc = await DailyEntry.findOneAndDelete({ date: ymdToDate(date) });
  return doc ? ok({ deleted: true }) : fail('Entry not found', 404);
});
