import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri =
  process.env.MONGO_URI ||
  (process.env as any).mongo_uri ||
  process.env.MONGO_URL ||
  process.env.MONGOURL;

export async function connectDB(): Promise<void> {
  if (!uri) {
    console.warn('MongoDB URI not set. Please add MONGO_URI to your .env file.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

export default mongoose;
