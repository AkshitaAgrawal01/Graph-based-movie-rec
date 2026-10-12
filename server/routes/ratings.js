import express from "express";
import Rating from "../models/Rating.js";
import { requireAuth } from "../middleware/auth.js";
import Movie from "../models/Movie.js";

const router = express.Router();
router.get("/", requireAuth, async (req, res) => {
  try {
    const ratings = await Rating.find({ userId: req.userId }).sort({ timestamp: -1 });

    if (ratings.length === 0) {
      return res.json({ ratings: [] });
    }

    const movieIds = ratings.map((r) => r.movieId);
    const movies = await Movie.find({ movieId: { $in: movieIds } });
    const movieById = new Map(movies.map((m) => [m.movieId, m]));

    const result = ratings
      .map((r) => {
        const movie = movieById.get(r.movieId);
        if (!movie) return null; // a rated movie that's since been removed from the catalog
        return {
          movieId: movie.movieId,
          title: movie.title,
          year: movie.year,
          genres: movie.genres,
          posterUrl: movie.posterUrl,
          rating: r.rating,
        };
      })
      .filter(Boolean);

    res.json({ ratings: result });
  } catch (err) {
    res.status(500).json({ error: "Could not load your ratings." });
  }
});

router.get("/recent", async (req, res) => {
  try {
    const ratings = await Rating.find().sort({ timestamp: -1 }).limit(20);
    const movieIds = ratings.map((r) => r.movieId);
    const movies = await Movie.find({ movieId: { $in: movieIds } });
    const movieById = new Map(movies.map((m) => [m.movieId, m]));
    
    // We want to return unique recently reviewed movies
    const uniqueMovies = new Map();
    for (const r of ratings) {
      if (!uniqueMovies.has(r.movieId)) {
        const movie = movieById.get(r.movieId);
        if (movie) uniqueMovies.set(r.movieId, movie);
      }
    }
    
    const result = Array.from(uniqueMovies.values()).slice(0, 10).map((m) => ({
      movieId: m.movieId,
      title: m.title,
      year: m.year,
      genres: m.genres,
      posterUrl: m.posterUrl
    }));

    res.json({ movies: result });
  } catch (err) {
    res.status(500).json({ error: "Could not load recent ratings." });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { movieId, rating } = req.body;

  const value = Number(rating);
  const validValue = Number.isFinite(value) && value >= 0.5 && value <= 5 && (value * 2) % 1 === 0;

  if (!movieId || !validValue) {
    return res.status(400).json({ error: "Rating must be 0.5 to 5 in half-star steps." });
  }

  try {
    // upsert: update the existing rating if present, otherwise create one --
    // this is what enforces "one rating per user per movie" (SRS §5.5),
    // working together with the unique index on the Rating model.
    const saved = await Rating.findOneAndUpdate(
      { userId: req.userId, movieId: Number(movieId) },
      { rating: value, timestamp: new Date() },
      { upsert: true, new: true }
    );

    res.json({ movieId: saved.movieId, rating: saved.rating });
  } catch (err) {
    res.status(500).json({ error: "Could not save your rating." });
  }
});

router.get("/:movieId", requireAuth, async (req, res) => {
  try {
    const existing = await Rating.findOne({ userId: req.userId, movieId: Number(req.params.movieId) });
    res.json({ rating: existing ? existing.rating : 0 }); // 0 = not rated yet
  } catch (err) {
    res.status(500).json({ error: "Could not load your rating." });
  }
});

export default router;