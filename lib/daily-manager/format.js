// lib/daily-manager/format.js
const f = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const inr = (n) => f.format(Number(n) || 0);
export const pct = (n) => `${(Number(n) || 0).toFixed(1)}%`;
export const compact = (n) => (Math.abs(n) >= 100000 ? `${(n / 100000).toFixed(1)}L` : Math.abs(n) >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
