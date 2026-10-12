import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/graphrec');
const col = mongoose.connection.db.collection('movies');
const total = await col.countDocuments();
const withUrl = await col.countDocuments({ posterUrl: { $nin: [null, ''] } });
const withPath = await col.countDocuments({ posterPath: { $nin: [null, ''] } });
const sample = await col.find({}).project({ title: 1, posterUrl: 1, posterPath: 1, tmdbId: 1, year: 1 }).limit(5).toArray();
const withPoster = await col.find({ posterUrl: { $nin: [null, ''] } }).project({ title: 1, posterUrl: 1, tmdbId: 1 }).limit(3).toArray();
console.log(JSON.stringify({ total, withUrl, withPath, sample, withPoster }, null, 2));
await mongoose.disconnect();
