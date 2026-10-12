import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import Movie from "../models/Movie.js";

const LINKS_CSV = "c:/Users/Janhavi/Movie-Rec/data/links.csv";
const TMDB_KEY = process.env.TMDB_API_KEY;
const DELAY_MS = 260; // ~3.8 req/s, well under TMDB's 40 req/s free limit
const BATCH_LOG = 200;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPoster(tmdbId) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}`
    );
    const data = await res.json();
    return data.poster_path ? data.poster_path : null;
  } catch {
    return null;
  }
}

async function run() {
  if (!TMDB_KEY) {
    console.error("TMDB_API_KEY not set in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Parse links.csv → Map<movieId, tmdbId>
  const lines = fs.readFileSync(LINKS_CSV, "utf8").trim().split("\n").slice(1);
  const linksMap = new Map();
  for (const line of lines) {
    const [movieId, , tmdbId] = line.trim().split(",");
    if (movieId && tmdbId && tmdbId.trim() !== "") {
      linksMap.set(Number(movieId), Number(tmdbId));
    }
  }
  console.log(`Loaded ${linksMap.size} movieId→tmdbId links from CSV.`);

  // First pass: write tmdbId for all movies in bulk (no API calls needed)
  const bulkOps = [];
  for (const [movieId, tmdbId] of linksMap.entries()) {
    bulkOps.push({
      updateOne: {
        filter: { movieId },
        update: { $set: { tmdbId } },
      },
    });
  }
  const bulkResult = await Movie.bulkWrite(bulkOps);
  console.log(`Updated tmdbId for ${bulkResult.modifiedCount} movies.`);

  // Second pass: fetch poster_path from TMDB for each movie
  const movies = await Movie.find({ tmdbId: { $exists: true, $ne: null }, posterUrl: null });
  console.log(`\n${movies.length} movies need poster enrichment from TMDB.`);

  let success = 0, failed = 0;
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const posterPath = await fetchPoster(movie.tmdbId);
    if (posterPath) {
      movie.posterUrl = posterPath; // store the /path part; frontend prepends TMDB base
      await movie.save();
      success++;
    } else {
      failed++;
    }
    if ((i + 1) % BATCH_LOG === 0) {
      console.log(`[${i + 1}/${movies.length}] ✓ ${success} | ✗ ${failed}`);
    }
    await delay(DELAY_MS);
  }

  console.log(`\nDone! Posters saved: ${success}. Missing: ${failed}.`);
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
