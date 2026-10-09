import express from "express";
import Recommendation from "../models/Recommendation.js";
import Rating from "../models/Rating.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const COLD_START_THRESHOLD = 3; // SRS §2.7: fallback until a user has rated at least 3 movies

router.get("/", requireAuth, async (req, res) => {
  try {
    const ratingCount = await Rating.countDocuments({ userId: req.userId });

    // Cold start: not enough ratings yet for a personalized list (REQ-REC-3)
    if (ratingCount < COLD_START_THRESHOLD) {
      const global = await Recommendation.findOne({ userId: "GLOBAL" });
      return res.json({
        items: global?.items ?? [],
        fallback: true,
      });
    }

    const personal = await Recommendation.findOne({ userId: req.userId });

    // A real user who has rated enough, but the Java job hasn't run
    // since they rated -- also fall back rather than show nothing.
    if (!personal || personal.items.length === 0) {
      const global = await Recommendation.findOne({ userId: "GLOBAL" });
      return res.json({
        items: global?.items ?? [],
        fallback: true,
      });
    }

    // REQ-REC-2: filter out movies the user has already rated,
    // in case they rated something new since the last compute run.
    const ratedMovieIds = new Set(
      (await Rating.find({ userId: req.userId }, "movieId")).map((r) => r.movieId)
    );
    const items = personal.items.filter((item) => !ratedMovieIds.has(item.movieId));

    res.json({ items, fallback: false });
  } catch (err) {
    res.status(500).json({ error: "Could not load recommendations." });
  }
});

router.get("/global", async (req, res) => {
  try {
    const global = await Recommendation.findOne({ userId: "GLOBAL" });
    res.json({ items: global?.items ?? [] });
  } catch (err) {
    res.status(500).json({ error: "Could not load top rated movies." });
  }
});

export default router;