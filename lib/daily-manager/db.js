// lib/daily-manager/db.js
import mongoose from 'mongoose';

const cache = (globalThis._dmMongo ||= { promise: null });

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return mongoose;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  cache.promise ||= mongoose.connect(uri, { bufferCommands: false }).catch((e) => {
    cache.promise = null;
    throw e;
  });
  await cache.promise;
  return mongoose;
}
