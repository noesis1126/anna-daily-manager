// lib/daily-manager/config.js
// Adjust these 5 lines ONLY if your existing Orders collection uses different names.
export const ORDERS_COLLECTION = 'orders';
export const ORDER_DATE_FIELD = 'createdAt';
export const PAID_FILTER = { $or: [{ paymentStatus: /^paid$/i }, { isPaid: true }, { status: /^paid$/i }] };
export const orderAmount = (o) => Number(o.totalAmount ?? o.total ?? o.grandTotal ?? o.amount ?? 0) || 0;
export const orderRef = (o) => String(o.orderNumber || o.orderId || String(o._id).slice(-6).toUpperCase());
export const orderMode = (o) => String(o.paymentMethod || o.paymentMode || '');
export const orderCustomer = (o) => String(o.customerName || o.customer?.name || o.name || '');
