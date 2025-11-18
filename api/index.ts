import 'dotenv/config';
import mongoose from 'mongoose';
import app from '../src/app';
import serverless from 'serverless-http';

const MONGO_URI = process.env.MONGO_URI;

async function connect() {
  try {
    if (!MONGO_URI) {
      console.warn('No MONGO_URI provided; requests requiring DB will fail');
      return;
    }
    if (mongoose.connection.readyState === 1) return;
    // Fail fast if Atlas is not reachable to avoid holding up function execution
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('Vercel function: connected to MongoDB');
  } catch (err) {
    console.error('Vercel function: MongoDB connection error (fast-fail)', err && (err as any).message ? (err as any).message : err);
    // do not throw — allow function to continue so non-DB endpoints (e.g. health) still respond
  }
}

// Attempt a background connect outside handler; it will fail fast if not reachable.
connect();

// Wrap the app with serverless handler.
const handler = serverless(app);

// Export handler as default for Vercel
export default async function (req: any, res: any) {
  // Ensure a short attempt to connect before handling request — avoid long blocking
  if (mongoose.connection.readyState !== 1) {
    // try connecting but don't await longer than serverSelectionTimeoutMS in connect()
    connect().catch(() => {});
  }
  return handler(req, res);
}
