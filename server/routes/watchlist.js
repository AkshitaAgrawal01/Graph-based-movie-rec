import express from "express";
import Watchlist from "../models/Watchlist.js";
import Movie from "../models/Movie.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

// Get watchlist
router.get("/", async (req, res) => {
  try {
    const list = await Watchlist.find({ userId: req.userId }).sort({ addedAt: -1 });
    const movieIds = list.map(l => l.movieId);
    
    // Fetch movies to populate titles/posters
    const movies = await Movie.find({ movieId: { $in: movieIds } });
    const movieMap = new Map(movies.map(m => [m.movieId, m]));

    res.json({
      items: list.map(l => {
        const m = movieMap.get(l.movieId);
        return {
          movieId: l.movieId,
          addedAt: l.addedAt,
          title: m?.title,
          year: m?.year,
          posterUrl: m?.posterUrl,
        };
      })
    });
  } catch (err) {
    res.status(500).json({ error: "Could not load watchlist." });
  }
});

// Add to watchlist
router.post("/", async (req, res) => {
  try {
    const { movieId } = req.body;
    if (!movieId) {
      return res.status(400).json({ error: "movieId is required." });
    }
    await Watchlist.updateOne(
      { userId: req.userId, movieId },
      { $setOnInsert: { userId: req.userId, movieId } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not add to watchlist." });
  }
});

// Remove from watchlist
router.delete("/:movieId", async (req, res) => {
  try {
    await Watchlist.deleteOne({ userId: req.userId, movieId: Number(req.params.movieId) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not remove from watchlist." });
  }
});

export default router;
