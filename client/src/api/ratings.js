import { delay } from "./movies.js";

// Fake "database table". A Map holds one value per key,
// so re-rating a movie replaces the old value (business rule 5.5).
const ratings = new Map();

export async function getMyRating(movieId) {
  await delay(150);
  return ratings.get(Number(movieId)) ?? 0; // 0 means "not rated yet"
}

export async function rateMovie(movieId, rating) {
  await delay(250);

  // Validate in the data layer too: never trust that the UI sent good data.
  const valid = rating >= 0.5 && rating <= 5 && Number.isInteger(rating * 2);
  if (!valid) throw new Error("Rating must be 0.5 to 5 in half-star steps");

  ratings.set(Number(movieId), rating);
  return { movieId: Number(movieId), rating };
}