import express from "express";
import Recommendation from "../models/Recommendation.js";
import Rating from "../models/Rating.js";
import Movie from "../models/Movie.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const COLD_START_THRESHOLD = 8; // SRS §2.7: fallback until a user has rated at least 3 movies

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

router.get("/graph", requireAuth, async (req, res) => {
  try {
    const personal = await Recommendation.findOne({ userId: req.userId });
    if (!personal || !personal.items || personal.items.length === 0) {
      return res.json({ nodes: [], links: [] });
    }

    const nodes = new Map();
    const links = [];

    // Add "You" node
    nodes.set(`u_${req.userId}`, { id: `u_${req.userId}`, label: "You", group: "you", val: 20 });

    const movieIdsToFetch = new Set();
    const addMovie = (id) => movieIdsToFetch.add(id);

    // Parse top neighbors and shared movies from recommendations
    // We limit to the top 3 recommended movies and top 2 neighbors to ensure
    // a clean, readable, well-spaced bipartite network (not an overcrowded cluster)
    for (const item of personal.items.slice(0, 3)) {
      if (!item.explanation || !item.explanation.topNeighbors) continue;

      const recMovieId = item.movieId;
      nodes.set(`m_${recMovieId}`, {
        id: `m_${recMovieId}`,
        label: `Movie ${recMovieId}`,
        group: "recommended",
        val: 12,
        radius: 11,
      });
      addMovie(recMovieId);

      for (const neighbor of item.explanation.topNeighbors.slice(0, 2)) {
        const nId = `u_${neighbor.neighborId}`;
        if (!nodes.has(nId)) {
          nodes.set(nId, {
            id: nId,
            label: `User ···${neighbor.neighborId.slice(-4)}`,
            group: "neighbor",
            val: 10,
            radius: 9,
            similarity: neighbor.similarity,
          });
        }
        
        // Link Neighbor -> Recommended Movie
        links.push({
          source: nId,
          target: `m_${recMovieId}`,
          label: "recommends",
          type: "recommendation",
        });

        // Add shared movies
        if (neighbor.sharedMovies) {
          for (const sMovieId of neighbor.sharedMovies.slice(0, 2)) {
            nodes.set(`m_${sMovieId}`, {
              id: `m_${sMovieId}`,
              label: `Movie ${sMovieId}`,
              group: "shared",
              val: 8,
              radius: 8,
            });
            addMovie(sMovieId);
            
            // Link You -> Shared Movie
            if (!links.find(l => l.source === `u_${req.userId}` && l.target === `m_${sMovieId}`)) {
              links.push({
                source: `u_${req.userId}`,
                target: `m_${sMovieId}`,
                label: "both rated",
                type: "shared_you",
              });
            }
            
            // Link Neighbor -> Shared Movie
            if (!links.find(l => l.source === nId && l.target === `m_${sMovieId}`)) {
              links.push({
                source: nId,
                target: `m_${sMovieId}`,
                label: "both rated",
                type: "shared_neighbor",
              });
            }
          }
        }
      }
    }

    // Fetch movie titles
    const movies = await Movie.find({ movieId: { $in: Array.from(movieIdsToFetch) } });
    const movieMap = new Map(movies.map(m => [m.movieId, m.title]));

    // Update movie node labels with actual titles
    for (const node of nodes.values()) {
      if (node.id.startsWith("m_")) {
        const id = Number(node.id.split("_")[1]);
        if (movieMap.has(id)) {
          node.label = movieMap.get(id);
        }
      }
    }

    res.json({ nodes: Array.from(nodes.values()), links });
  } catch (err) {
    res.status(500).json({ error: "Could not generate neighbor graph." });
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