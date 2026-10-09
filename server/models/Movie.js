import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  movieId: { type: Number, required: true, unique: true }, // the original MovieLens id
  title: { type: String, required: true },
  year: Number,
  genres: [String],
  tmdbId: { type: Number, default: null },
  posterUrl: { type: String, default: null },
});

export default mongoose.model("Movie", movieSchema);