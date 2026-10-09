import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  legacyId: { type: String, default: null }, // MovieLens numeric id, as a string; null for real signups
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);