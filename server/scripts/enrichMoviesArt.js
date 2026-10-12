import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/Movie.js';
import path from 'path';
import { fileURLToPath } from 'url';
import movieArt from 'movie-art';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const movies = await Movie.find({ posterUrl: null });
  console.log(`Found ${movies.length} movies needing TMDB enrichment via movie-art.`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    try {
      const url = await movieArt(movie.title, { year: movie.year, size: 'w500' });
      if (url && url.includes('tmdb.org')) {
        // movie-art returns full URL like http://image.tmdb.org/t/p/w500/xyz.jpg
        // our frontend expects posterUrl to be just the path /xyz.jpg because it prepends it
        const urlObj = new URL(url);
        const urlPath = urlObj.pathname.replace('/t/p/w500', '');
        movie.posterUrl = urlPath;
        await movie.save();
        success++;
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
    }

    if ((i + 1) % 50 === 0) {
      console.log(`Processed ${i + 1}/${movies.length}. Success: ${success}, Failed: ${failed}`);
    }

    // Rate limit mildly to avoid abusing the embedded key
    await delay(100);
  }

  console.log(`Enrichment complete. Success: ${success}, Failed: ${failed}`);
  process.exit(0);
};

run().catch(console.error);
