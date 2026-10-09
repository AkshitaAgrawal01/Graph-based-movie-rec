import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

import User from "../models/User.js";
import Movie from "../models/Movie.js";
import Rating from "../models/Rating.js";

const DATA_DIR = path.resolve("../data");

function readCsv(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return parse(raw, { columns: true, skip_empty_lines: true });
}

function extractYear(title) {
  const match = title.match(/\((\d{4})\)\s*$/);
  return match ? Number(match[1]) : null;
}

async function importMovies() {
  const movieRows = readCsv("movies.csv");
  const linkRows = readCsv("links.csv");

  // Build a quick lookup: movieId -> tmdbId
  const tmdbByMovieId = new Map();
  for (const row of linkRows) {
    if (row.tmdbId) tmdbByMovieId.set(Number(row.movieId), Number(row.tmdbId));
  }

  const docs = movieRows.map((row) => ({
    movieId: Number(row.movieId),
    title: row.title,
    year: extractYear(row.title),
    genres: row.genres === "(no genres listed)" ? [] : row.genres.split("|"),
    tmdbId: tmdbByMovieId.get(Number(row.movieId)) ?? null,
    posterUrl: null, // filled in later, when we build the TMDB fetch step
  }));

  // insertMany with ordered:false keeps going even if one document fails,
  // and this re-run-safe check skips the whole step if movies already exist.
  const existing = await Movie.countDocuments();
  if (existing > 0) {
    console.log(`Movies already imported (${existing} found). Skipping.`);
    return;
  }

  await Movie.insertMany(docs);
  console.log(`Inserted ${docs.length} movies.`);
}

async function importUsers() {
  const ratingRows = readCsv("ratings.csv");
  const distinctUserIds = [...new Set(ratingRows.map((r) => r.userId))];

  const existing = await User.countDocuments({ legacyId: { $ne: null } });
  if (existing > 0) {
    console.log(`MovieLens users already imported (${existing} found). Skipping.`);
    return;
  }

  const docs = distinctUserIds.map((legacyId) => ({
    legacyId,
    name: `MovieLens User ${legacyId}`,
    email: `movielens-${legacyId}@example.invalid`,
    passwordHash: "not-a-real-account", // these accounts can't actually log in
  }));

  await User.insertMany(docs);
  console.log(`Inserted ${docs.length} MovieLens users.`);
}

async function importRatings() {
  const existing = await Rating.countDocuments();
  if (existing > 0) {
    console.log(`Ratings already imported (${existing} found). Skipping.`);
    return;
  }

  const ratingRows = readCsv("ratings.csv");

  // Build legacyId -> Mongo _id lookup, once, instead of querying per row.
  const users = await User.find({ legacyId: { $ne: null } }, "_id legacyId");
  const userIdByLegacyId = new Map(users.map((u) => [u.legacyId, u._id]));

  const docs = [];
  let skipped = 0;

  for (const row of ratingRows) {
    const userId = userIdByLegacyId.get(row.userId);
    if (!userId) {
      skipped++;
      continue; // a row referencing a user we somehow didn't create
    }
    docs.push({
      userId,
      movieId: Number(row.movieId),
      rating: Number(row.rating),
      timestamp: new Date(Number(row.timestamp) * 1000), // MovieLens stores Unix seconds
    });
  }

  await Rating.insertMany(docs, { ordered: false });
  console.log(`Inserted ${docs.length} ratings. Skipped ${skipped} bad rows.`);
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    await importMovies();
    await importUsers();
    await importRatings();

    console.log("Import complete.");
  } catch (err) {
    console.error("Import failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();