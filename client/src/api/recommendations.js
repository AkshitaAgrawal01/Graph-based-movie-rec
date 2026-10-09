const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getRecommendations() {
  const res = await fetch(`${API_URL}/recommendations`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Could not load recommendations.");
  const { items, fallback } = await res.json();

  if (items.length === 0) {
    return { movies: [], fallback };
  }

  const ids = items.map((item) => item.movieId).join(",");
  const movieRes = await fetch(`${API_URL}/movies?ids=${ids}`);
  if (!movieRes.ok) throw new Error("Could not load recommended movies.");
  const { movies } = await movieRes.json();

  // Merge each movie's details with its score, and restore the original
  // score-sorted order (the batch endpoint doesn't guarantee one).
  const scoreByMovieId = new Map(items.map((item) => [item.movieId, item.score]));
  const merged = movies
    .map((movie) => ({ ...movie, score: scoreByMovieId.get(movie.movieId) }))
    .sort((a, b) => b.score - a.score);

  return { movies: merged, fallback };
}
export async function getTopRated() {
  const res = await fetch(`${API_URL}/recommendations/global`);
  if (!res.ok) throw new Error("Could not load top rated movies.");
  const { items } = await res.json();

  if (items.length === 0) return [];

  const ids = items.map((item) => item.movieId).join(",");
  const movieRes = await fetch(`${API_URL}/movies?ids=${ids}`);
  if (!movieRes.ok) throw new Error("Could not load top rated movies.");
  const { movies } = await movieRes.json();

  const scoreByMovieId = new Map(items.map((item) => [item.movieId, item.score]));
  return movies
    .map((movie) => ({ ...movie, score: scoreByMovieId.get(movie.movieId) }))
    .sort((a, b) => b.score - a.score);
}