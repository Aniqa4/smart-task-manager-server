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
    await mongoose.connect(MONGO_URI);
    console.log('Vercel function: connected to MongoDB');
  } catch (err) {
    console.error('Vercel function: MongoDB connection error', err);
  }
}

// Connect outside handler so the connection can be reused across invocations when possible
connect();

const handler = serverless(app);
export default handler;
