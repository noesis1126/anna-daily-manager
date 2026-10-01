// lib/daily-manager/export.js  (client only; loaded on demand when a report is exported)
import { prettyDate, prettyMonth } from './dates';

// jsPDF's built-in fonts cannot draw the rupee symbol, so PDFs use "Rs."
const rs = (n) => `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(n) || 0)}`;

async function saveXlsx(name, sheets) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const [title, rows, widths] of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = (widths || []).map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
  }
  XLSX.writeFile(wb, name);
}

async function savePdf(name, title, blocks) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 16);
  let y = 22;
  for (const b of blocks) {
    if (b.heading) { doc.setFontSize(11); doc.text(b.heading, 14, y + 5); y += 7; }
    autoTable(doc, {
      startY: y, head: b.head ? [b.head] : undefined, body: b.body, foot: b.foot ? [b.foot] : undefined,
      theme: 'grid', styles: { fontSize: 9 }, headStyles: { fillColor: [153, 27, 27] },
      footStyles: { fillColor: [253, 230, 138], textColor: 20 }, didParseCell: b.cell,
    });
    y = doc.lastAutoTable.finalY + 8;
  }
  doc.save(name);
}

export async function exportDaily(kind, s, items) {
  const label = prettyDate(s.date);
  const summary = [
    ['Total sales', s.sales], ['Cash received', s.cash], ['Online received', s.online], ['Total expense', s.expense],
    ['Net profit/loss', s.profit], ['Bank deposits', s.deposit], ['Cash in hand (this day)', s.cashInHand],
    ['Cash in hand (total till this day)', s.cashInHandTotal], ['Pending tasks', s.pendingTasks],
  ];
  const expRows = items.map((x) => [x.name, x.category, x.quantity ? `${x.quantity} ${x.unit}` : '', x.mode, x.cost, x.note || '']);
  if (kind === 'xlsx') {
    return saveXlsx(`daily-report-${s.date}.xlsx`, [
      ['Summary', [['Daily report', label], ...summary], [34, 18]],
      ['Expenses', [['Item', 'Category', 'Quantity', 'Paid by', 'Cost (INR)', 'Note'], ...expRows], [26, 14, 14, 10, 12, 30]],
      ['Categories', [['Category', 'Amount (INR)', 'Share %'], ...s.categories.map((c) => [c.category, c.total, c.pct])], [18, 14, 10]],
      ['Deposits', [['Amount (INR)', 'Note'], ...s.deposits.map((d) => [d.amount, d.note || ''])], [14, 36]],
      ['Website orders', [['Order', 'Customer', 'Mode', 'Amount (INR)'], ...s.orders.list.map((o) => [o.ref, o.customer, o.mode, o.amount])], [14, 24, 12, 14]],
    ]);
  }
  return savePdf(`daily-report-${s.date}.pdf`, `Anna Chinese Restaurant - Daily report, ${label}`, [
    { body: summary.map(([k, v]) => [k, k === 'Pending tasks' ? String(v) : rs(v)]) },
    { heading: 'Expenses', head: ['Item', 'Category', 'Qty', 'Paid by', 'Cost', 'Note'], body: expRows.length ? expRows.map((r) => [...r.slice(0, 4), rs(r[4]), r[5]]) : [['No expenses', '', '', '', '', '']] },
    { heading: 'Category share', head: ['Category', 'Amount', 'Share'], body: s.categories.length ? s.categories.map((c) => [c.category, rs(c.total), `${c.pct.toFixed(1)}%`]) : [['None', '', '']] },
  ]);
}

export async function exportMonthly(kind, m) {
  const title = prettyMonth(m.month);
  const t = m.totals;
  const dayRows = m.days.map((d) => [d.date, d.sales, d.cash, d.online, d.expense, d.profit]);
  const summary = [
    ['Total sales', t.sales], ['Total money gone out', m.moneyOut], ['Profit/loss', t.profit], ['Bank income (deposits)', m.bankIncome],
    ['Cash in hand (this month)', m.cashInHand], ['Cash in hand (total)', m.cashInHandTotal],
    ['Best day', m.best ? `${m.best.date} (${m.best.profit})` : '-'], ['Worst day', m.worst ? `${m.worst.date} (${m.worst.profit})` : '-'],
  ];
  if (kind === 'xlsx') {
    return saveXlsx(`monthly-report-${m.month}.xlsx`, [
      ['Summary', [['Monthly report', title], ...summary], [30, 22]],
      ['Days', [['Date', 'Sales', 'Cash', 'Online', 'Expense', 'Profit'], ...dayRows, ['Total', t.sales, t.cash, t.online, t.expense, t.profit]], [14, 12, 12, 12, 12, 12]],
      ['Categories', [['Category', 'Amount (INR)', 'Share %'], ...m.categories.map((c) => [c.category, c.total, c.pct])], [18, 14, 10]],
    ]);
  }
  return savePdf(`monthly-report-${m.month}.pdf`, `Anna Chinese Restaurant - Monthly report, ${title}`, [
    { body: summary.map(([k, v]) => [k, typeof v === 'number' ? rs(v) : v]) },
    {
      heading: 'Day by day', head: ['Date', 'Sales', 'Cash', 'Online', 'Expense', 'Profit'],
      body: m.days.map((d) => [d.date, rs(d.sales), rs(d.cash), rs(d.online), rs(d.expense), rs(d.profit)]),
      foot: ['Total', rs(t.sales), rs(t.cash), rs(t.online), rs(t.expense), rs(t.profit)],
      cell: (h) => {
        if (h.section !== 'body') return;
        const d = m.days[h.row.index];
        if (h.column.index === 5 && (d.filled || d.expense > 0)) h.cell.styles.textColor = d.profit >= 0 ? [22, 101, 52] : [185, 28, 28];
      },
    },
    { heading: 'Expenses by category', head: ['Category', 'Amount', 'Share'], body: m.categories.length ? m.categories.map((c) => [c.category, rs(c.total), `${c.pct.toFixed(1)}%`]) : [['None', '', '']] },
  ]);
}
