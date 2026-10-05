import { MOVIES, OVERVIEWS } from "./mockData.js";

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getMovies({ search = "", page = 1, pageSize = 8 } = {}) {
  await delay(300); // pretend the network takes a moment

  const q = search.trim().toLowerCase();
  const filtered = q
    ? MOVIES.filter((m) => m.title.toLowerCase().includes(q)) // REQ-BROWSE-2: substring match
    : MOVIES;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;

  return {
    movies: filtered.slice(start, start + pageSize),
    page,
    totalPages,
    total: filtered.length,
  };
}

export async function getMovie(id) {
  await delay(200);

  const movie = MOVIES.find((m) => m.movieId === Number(id));
  if (!movie) return null; // "not found" is an expected outcome, not a failure

  return { ...movie, overview: OVERVIEWS[movie.movieId] ?? null };
}