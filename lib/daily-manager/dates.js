// lib/daily-manager/dates.js  (all dates are IST day-start; ymd = "YYYY-MM-DD")
const TZ = 'Asia/Kolkata';
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
export const todayYmd = () => fmt.format(new Date());
export const dateToYmd = (d) => fmt.format(new Date(d));
export const ymdToDate = (ymd) => new Date(`${ymd}T00:00:00+05:30`);
export const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T12:00:00+05:30`);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt.format(d);
};
export const daysInMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};
export const shiftMonth = (ym, n) => {
  let [y, m] = ym.split('-').map(Number);
  m += n;
  y += Math.floor((m - 1) / 12);
  m = (((m - 1) % 12) + 12) % 12 + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
};
export const monthStart = (ym) => ymdToDate(`${ym}-01`);
export const prettyDate = (ymd) =>
  new Date(`${ymd}T12:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const shortDate = (ymd) =>
  new Date(`${ymd}T12:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
export const prettyMonth = (ym) =>
  new Date(`${ym}-15T12:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: TZ, month: 'long', year: 'numeric' });
export const monthName = (ym) =>
  new Date(`${ym}-15T12:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: TZ, month: 'short' });
export const prettyTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
export const time12 = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
