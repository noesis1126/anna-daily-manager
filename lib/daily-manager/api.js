// lib/daily-manager/api.js  (client fetch helper)
export async function api(url, opts = {}) {
  const { body, ...rest } = opts;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...rest,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.');
    err.fields = data.fields;
    err.status = res.status;
    throw err;
  }
  return data;
}
