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

router.get("/:movieId", async (req, res) => {
  try {
    const movie = await Movie.findOne({ movieId: Number(req.params.movieId) });
    if (!movie) return res.status(404).json({ error: "Movie not found." });

    res.json({
      movieId: movie.movieId,
      title: movie.title,
      year: movie.year,
      genres: movie.genres,
      posterUrl: movie.posterUrl,
      overview: movie.overview ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not load this movie." });
  }
});

export default router;