import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  movieId: { type: Number, required: true },
  rating: { type: Number, required: true, min: 0.5, max: 5 },
  timestamp: { type: Date, default: Date.now },
});

// Business rule: one rating per user per movie. Re-rating updates, never duplicates.
ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });

export default mongoose.model("Rating", ratingSchema);