import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import Movie from '../models/Movie.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.error("FATAL: Please set TMDB_API_KEY in server/.env");
  process.exit(1);
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const movies = await Movie.find({ posterUrl: null, tmdbId: { $ne: null } });
  console.log(`Found ${movies.length} movies needing TMDB enrichment.`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    try {
      const { data } = await axios.get(`https://api.themoviedb.org/3/movie/${movie.tmdbId}`, {
        params: { api_key: TMDB_API_KEY },
        timeout: 5000,
      });

      if (data.poster_path) {
        movie.posterUrl = `${data.poster_path}`;
        await movie.save();
        success++;
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
    }

    if ((i + 1) % 100 === 0) {
      console.log(`Processed ${i + 1}/${movies.length}. Success: ${success}, Failed: ${failed}`);
    }

    // Rate limit
    await delay(300);
  }

  console.log(`Enrichment complete. Success: ${success}, Failed: ${failed}`);
  process.exit(0);
};

run().catch(console.error);
