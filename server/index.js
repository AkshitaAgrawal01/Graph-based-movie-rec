import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import ratingRoutes from "./routes/ratings.js";


const app = express();

app.use(cors());
app.use(express.json()); // parses incoming JSON request bodies into req.body

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/ratings", ratingRoutes);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();