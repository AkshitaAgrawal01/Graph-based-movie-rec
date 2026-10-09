import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyRatings } from "../api/ratings.js";
import { getRecommendations, getTopRated } from "../api/recommendations.js";
import MovieCard from "../components/MovieCard.jsx";
import "./Profile.css";

export default function Profile() {
  const { user } = useAuth();

  const [ratings, setRatings] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [recommended, setRecommended] = useState([]);
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
        const [myRatings, top, recs] = await Promise.all([
          getMyRatings(),
          getTopRated(),
          getRecommendations(),
        ]);
        if (!ignore) {
          setRatings(myRatings);
          setTopRated(top);
          setRecommended(recs.movies);
          setFallback(recs.fallback);
        }
      } catch {
        if (!ignore) setError("We couldn't load your profile. Check your connection and try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [user]);

  if (!user) {
    return <p className="status">Sign in to see your profile.</p>;
  }

  if (loading) return <p className="status">Loading your profile</p>;
  if (error) return <p className="status">{error}</p>;

  return (
    <div className="profile">
      <h1 className="page-title">Hi, {user.name}</h1>

      <section>
        <h2 className="section-title">Your ratings</h2>
        {ratings.length === 0 ? (
          <p className="status">You haven't rated anything yet.</p>
        ) : (
          <div className="grid">
            {ratings.map((m) => (
              <div key={m.movieId} className="rated-card">
                <MovieCard movie={m} />
                <div className="rated-badge">{m.rating} ★</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">Top rated</h2>
        <div className="grid">
          {topRated.map((m) => (
            <MovieCard key={m.movieId} movie={m} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">Recommended for you</h2>
        {fallback && (
          <p className="fallback-note">
            Rate a few more movies to get picks tailored to you.
          </p>
        )}
        {recommended.length === 0 ? (
          <p className="status">Nothing to show yet.</p>
        ) : (
          <div className="grid">
            {recommended.map((m) => (
              <MovieCard key={m.movieId} movie={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}