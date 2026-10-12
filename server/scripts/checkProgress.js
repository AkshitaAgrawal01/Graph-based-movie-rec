import "dotenv/config";
import mongoose from "mongoose";
import Movie from "../models/Movie.js";

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await Movie.countDocuments();
  const withPoster = await Movie.countDocuments({ posterUrl: { $exists: true, $ne: null, $gt: "" } });
  const withTmdbId = await Movie.countDocuments({ tmdbId: { $exists: true, $ne: null } });
  console.log(`Total: ${total}`);
  console.log(`With tmdbId: ${withTmdbId}`);
  console.log(`With poster: ${withPoster}`);
  console.log(`Still missing poster: ${total - withPoster}`);
  process.exit(0);
}

check().catch(console.error);
