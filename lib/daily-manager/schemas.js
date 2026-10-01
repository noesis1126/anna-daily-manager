// lib/daily-manager/schemas.js  (shared by API routes and forms; requires zod v3)
import { z } from 'zod';
import { CATEGORIES, UNITS, MODES, PRIORITIES } from './constants';

const blank = (v) => v === '' || v === null || v === undefined;
const clean = (v) => Number(String(v).replace(/,/g, ''));
const money = (min = 0, minMsg = 'Cannot be negative') =>
  z.preprocess(
    (v) => (blank(v) ? undefined : clean(v)),
    z.number({ required_error: 'This field is required', invalid_type_error: 'Enter a valid number' })
      .min(min, minMsg).max(100000000, 'Amount is too large')
  );
const money0 = z.preprocess(
  (v) => (blank(v) ? 0 : clean(v)),
  z.number({ invalid_type_error: 'Enter a valid number' }).min(0, 'Cannot be negative').max(100000000, 'Amount is too large')
);
const text = (max) => z.string().trim().max(max, `Max ${max} characters`).optional().default('');

export const ymd = z.string({ required_error: 'Pick a date' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date');
export const ym = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM');
export const yearStr = z.string().regex(/^\d{4}$/, 'Use YYYY');

export const taskSchema = z.object({
  title: z.string({ required_error: 'Enter a task title' }).trim().min(1, 'Enter a task title').max(120, 'Max 120 characters'),
  note: text(500),
  priority: z.enum(PRIORITIES, { errorMap: () => ({ message: 'Pick a priority' }) }).default('medium'),
  dueTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time').or(z.literal('')).default(''),
  status: z.enum(['pending', 'done']).default('pending'),
  assignedTo: text(60),
  date: ymd,
  recurring: z.boolean().default(false),
});
export const taskPatchSchema = taskSchema.omit({ recurring: true }).partial();

export const expenseSchema = z
  .object({
    name: z.string({ required_error: 'Enter the item name' }).trim().min(1, 'Enter the item name').max(100, 'Max 100 characters'),
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Pick a category' }) }),
    quantity: z.preprocess(
      (v) => (blank(v) ? null : clean(v)),
      z.number({ invalid_type_error: 'Enter a valid number' }).min(0, 'Cannot be negative').nullable()
    ),
    unit: z.enum([...UNITS, '']).default(''),
    cost: money(0.01, 'Enter an amount above 0'),
    mode: z.enum(MODES, { errorMap: () => ({ message: 'Choose Cash or Online' }) }),
    date: ymd,
    note: text(300),
  })
  .superRefine((d, ctx) => {
    if (d.quantity > 0 && !d.unit) ctx.addIssue({ code: 'custom', path: ['unit'], message: 'Pick a unit' });
  });

export const dailyEntrySchema = z.object({
  date: ymd,
  sales: money(),
  cash: money0,
  online: money0,
  notes: text(300),
});

export const depositSchema = z.object({
  amount: money(0.01, 'Enter an amount above 0'),
  date: ymd,
  note: text(300),
});

export function validate(schema, values) {
  const r = schema.safeParse(values);
  if (r.success) return { data: r.data, errors: {} };
  const errors = {};
  for (const i of r.error.issues) {
    const k = i.path[0];
    if (k !== undefined && !errors[k]) errors[k] = i.message;
  }
  return { data: null, errors };
}
export const fieldErrors = (fields = {}) =>
  Object.fromEntries(Object.entries(fields).map(([k, a]) => [k, Array.isArray(a) ? a[0] : a]));
