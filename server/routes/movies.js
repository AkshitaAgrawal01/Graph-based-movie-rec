import express from "express";
import Movie from "../models/Movie.js";

const router = express.Router();

router.get("/", async (req, res) => {
  // Batch mode: ?ids=318,858,2571 -- used by the Recommendations page
  // to fetch many specific movies in one request instead of one-per-movie.
  if (req.query.ids) {
    const ids = req.query.ids
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id)); // drop anything malformed, rather than erroring

    try {
      const movies = await Movie.find({ movieId: { $in: ids } });
      return res.json({
        movies: movies.map((m) => ({
          movieId: m.movieId,
          title: m.title,
          year: m.year,
          genres: m.genres,
          posterUrl: m.posterUrl,
        })),
      });
    } catch (err) {
      return res.status(500).json({ error: "Could not load movies." });
    }
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(50, parseInt(req.query.pageSize) || 8);
  const search = (req.query.search || "").trim();

  // Escape regex special characters so a search like "(2001)" or "C++"
  // can't break the query or be used for injection (SRS §5.3).
  const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = safeSearch
    ? { title: { $regex: safeSearch, $options: "i" } } // "i" = case-insensitive
    : {};

  if (req.query.genre) {
    filter.genres = req.query.genre;
  }
  if (req.query.year) {
    filter.year = Number(req.query.year);
  }
  if (req.query.minRating) {
    const min = parseFloat(req.query.minRating);
    if (!isNaN(min) && min > 0) {
      const RatingModel = (await import("../models/Rating.js")).default;
      const ratedMovies = await RatingModel.aggregate([
        { $group: { _id: "$movieId", avg: { $avg: "$rating" } } },
        { $match: { avg: { $gte: min } } },
        { $project: { _id: 1 } },
      ]);
      const matchedIds = ratedMovies.map((r) => r._id);
      filter.movieId = { $in: matchedIds };
    }
  }

  try {
    const total = await Movie.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const movies = await Movie.find(filter)
      .sort({ movieId: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      movies: movies.map((m) => ({
        movieId: m.movieId,
        title: m.title,
        year: m.year,
        genres: m.genres,
        posterUrl: m.posterUrl,
      })),
      page,
      totalPages,
      total,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not load movies." });
  }
});

router.get("/trending", async (req, res) => {
  try {
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.TMDB_API_KEY}`
    );
    const tmdbData = await tmdbRes.json();
    if (!tmdbData.results) {
      return res.json({ movies: [] });
    }

    const tmdbIds = tmdbData.results.map((m) => m.id);
    const localMatches = await Movie.find({ tmdbId: { $in: tmdbIds } });
    const localMap = new Map(localMatches.map((m) => [m.tmdbId, m]));

    const movies = tmdbData.results.slice(0, 15).map((m) => {
      const local = localMap.get(m.id);
      return {
        movieId: local ? local.movieId : m.id,
        title: m.title,
        year: m.release_date ? new Date(m.release_date).getFullYear() : null,
        posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
        genres: [],
        overview: m.overview,
      };
    });

    res.json({ movies });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch trending movies." });
  }
});

import Rating from "../models/Rating.js";

router.get("/:movieId", async (req, res) => {
  try {
    const movieId = Number(req.params.movieId);
    const movie = await Movie.findOne({ movieId });
    if (!movie) return res.status(404).json({ error: "Movie not found." });

    const agg = await Rating.aggregate([
      { $match: { movieId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const avgRating = agg.length ? agg[0].avg : 0;
    const ratingCount = agg.length ? agg[0].count : 0;

    res.json({
      movieId: movie.movieId,
      title: movie.title,
      year: movie.year,
      genres: movie.genres,
      tmdbId: movie.tmdbId,
      posterUrl: movie.posterUrl,
      overview: movie.overview ?? null,
      averageRating: avgRating,
      ratingCount: ratingCount
    });
  } catch (err) {
    res.status(500).json({ error: "Could not load this movie." });
  }
});

router.get("/:movieId/tmdb", async (req, res) => {
  try {
    const movie = await Movie.findOne({ movieId: Number(req.params.movieId) });
    if (!movie || !movie.tmdbId) return res.json(null);

    const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits,videos`);
    const data = await tmdbRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch TMDB details." });
  }
});

export default router;