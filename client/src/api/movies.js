const API_URL = import.meta.env.VITE_API_URL;

export async function getMovies({ search = "", page = 1, pageSize = 8 } = {}) {
  const params = new URLSearchParams({ search, page, pageSize });
  const res = await fetch(`${API_URL}/movies?${params}`);

  if (!res.ok) throw new Error("Could not load movies.");
  return res.json();
}

export async function getMovie(id) {
  const res = await fetch(`${API_URL}/movies/${id}`);

  if (res.status === 404) return null; // "not found" is an expected outcome, not a failure
  if (!res.ok) throw new Error("Could not load this movie.");
  return res.json();
}