// lib/daily-manager/orders.js  (server only) - reads the existing Orders collection, read-only
import mongoose from 'mongoose';
import { ORDERS_COLLECTION, ORDER_DATE_FIELD, PAID_FILTER, orderAmount, orderRef, orderMode, orderCustomer } from './config';

export async function paidOrders(start, end) {
  try {
    const docs = await mongoose.connection.db
      .collection(ORDERS_COLLECTION)
      .find({ [ORDER_DATE_FIELD]: { $gte: start, $lt: end }, ...PAID_FILTER })
      .sort({ [ORDER_DATE_FIELD]: 1 })
      .limit(500)
      .toArray();
    const list = docs.map((o) => ({
      id: String(o._id),
      ref: orderRef(o),
      amount: orderAmount(o),
      mode: orderMode(o),
      customer: orderCustomer(o),
      time: o[ORDER_DATE_FIELD],
    }));
    return { count: list.length, total: Math.round(list.reduce((a, o) => a + o.amount, 0) * 100) / 100, list };
  } catch (e) {
    console.error('[daily-manager] orders lookup failed', e);
    return { count: 0, total: 0, list: [] };
  }
}
