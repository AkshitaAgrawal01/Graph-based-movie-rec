const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMyRating(movieId) {
  const res = await fetch(`${API_URL}/ratings/${movieId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) return 0; // not signed in, or no rating yet -- both show as "unrated"
  const data = await res.json();
  return data.rating;
}

export async function rateMovie(movieId, rating) {
  const res = await fetch(`${API_URL}/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ movieId, rating }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not save your rating.");
  }

  return res.json();
}
export async function getMyRatings() {
  const res = await fetch(`${API_URL}/ratings`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Could not load your ratings.");
  const { ratings } = await res.json();
  return ratings;
}