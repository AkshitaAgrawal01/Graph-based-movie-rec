import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendations } from "../api/recommendations.js";
import { useAuth } from "../context/AuthContext.jsx";
import MovieCard from "../components/MovieCard.jsx";
import "./Recommendations.css";

export default function Recommendations() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await getRecommendations();
        if (!ignore) {
          setMovies(result.movies);
          setFallback(result.fallback);
        }
      } catch {
        if (!ignore) setError("We couldn't load your recommendations. Check your connection and try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [user]);

  if (!user) {
    return (
      <div>
        <h1 className="page-title">For you</h1>
        <p className="status">
          <Link to="/login" state={{ from: "/recommendations" }} className="inline-link">Sign in</Link>{" "}
          to see personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">For you</h1>

      {fallback && !loading && !error && (
        <p className="fallback-note">
          Rate a few more movies to get picks tailored to you. For now, here are some popular favorites.
        </p>
      )}

      {error && <p className="status">{error}</p>}
      {loading && <p className="status">Loading your recommendations</p>}
      {!loading && !error && movies.length === 0 && (
        <p className="status">Nothing to show yet. Rate a few movies to get started.</p>
      )}

      <div className="grid">
        {movies.map((m) => (
          <MovieCard key={m.movieId} movie={m} />
        ))}
      </div>
    </div>
  );
}