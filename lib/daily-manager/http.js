// lib/daily-manager/http.js  (server only)
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { connectDB } from './db';
import { dateToYmd } from './dates';

export const ok = (data, status = 200) => NextResponse.json(data, { status });
export const fail = (error, status = 400, fields) =>
  NextResponse.json({ error, ...(fields ? { fields } : {}) }, { status });
export const qs = (req, k) => new URL(req.url).searchParams.get(k);

export function ser(doc) {
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { _id, __v, date, templateId, ...rest } = o;
  return {
    ...rest,
    id: String(_id),
    ...(date ? { date: dateToYmd(date) } : {}),
    ...(templateId ? { templateId: String(templateId) } : {}),
  };
}

export const handler = (fn) => async (req, ctx) => {
  try {
    await connectDB();
    return await fn(req, ctx);
  } catch (e) {
    if (e instanceof ZodError) return fail('Please fix the highlighted fields', 400, e.flatten().fieldErrors);
    if (e instanceof SyntaxError) return fail('Invalid request body', 400);
    if (e?.name === 'CastError') return fail('Invalid id', 400);
    if (e?.code === 11000) return fail('This record already exists', 409);
    console.error('[daily-manager]', e);
    return fail('Server error. Please try again.', 500);
  }
};
