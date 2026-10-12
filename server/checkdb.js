import mongoose from 'mongoose';

async function check() {
  await mongoose.connect('mongodb://localhost:27017/graphrec');
  const db = mongoose.connection.client.db();
  const m = await db.collection('movies').findOne({ posterUrl: { $ne: null } });
  console.log(m);
  mongoose.disconnect();
}
check();
