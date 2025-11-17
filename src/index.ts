import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './app';

const PORT = process.env.PORT || 3000;

async function start() {
  let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-task-manager';

  // Optionally use in-memory mongo for tests/dev by setting USE_INMEM_DB=true
  if (process.env.USE_INMEM_DB === 'true') {
    try {
      // lazy import to avoid adding dependency when not used
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log('Using in-memory MongoDB');
    } catch (err) {
      console.warn('Failed to start in-memory MongoDB:', err);
    }
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error', err);
    // continue without exiting so dev server can still run for smoke tests (some routes will fail without DB)
  }

  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

start();
