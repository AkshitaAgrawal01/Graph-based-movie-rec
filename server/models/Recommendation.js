import mongoose from "mongoose";

const recommendationItemSchema = new mongoose.Schema({
  movieId: { type: Number, required: true },
  score: { type: Number, required: true },
  explanation: {
    numNeighbors: Number,
    avgSimilarity: Number,
    topNeighbors: [{
      neighborId: String,
      similarity: Number,
      rating: Number,
      sharedMovies: [Number]
    }]
  }
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items: [recommendationItemSchema],
  computedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Recommendation", recommendationSchema);