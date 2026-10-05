import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMovie } from "../api/movies.js";
import { getMyRating, rateMovie } from "../api/ratings.js";
import Poster from "../components/Poster.jsx";
import StarRating from "../components/StarRating.jsx";
import "./MovieDetail.css";

// TEMPORARY stand-in until F4 builds real login.
// Change it to `null` to see the signed-out view.
const currentUser = { name: "demo" };

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      setSaveMessage("");
      try {
        const [m, r] = await Promise.all([
          getMovie(id),
          currentUser ? getMyRating(id) : 0,
        ]);
        if (!ignore) {
          setMovie(m);
          setMyRating(r);
        }
      } catch {
        if (!ignore) setError("We couldn't load this movie. Check your connection and try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [id]);

  async function handleRate(value) {
    const previous = myRating;
    setMyRating(value); // show the new rating immediately
    setSaveMessage("");
    try {
      await rateMovie(movie.movieId, value);
      setSaveMessage("Rating saved.");
    } catch {
      setMyRating(previous); // put the old rating back
      setSaveMessage("We couldn't save your rating. Try again.");
    }
  }

  if (loading) return <p className="detail-status">Loading movie</p>;
  if (error) return <p className="detail-status">{error}</p>;
  if (!movie) {
    return (
      <div>
        <p className="detail-status">We couldn't find that movie.</p>
        <Link to="/" className="back">Back to all movies</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="back">All movies</Link>

      <div className="detail">
        <Poster movie={movie} large />

        <div>
          <h1 className="detail-title">{movie.title}</h1>
          <p className="detail-meta">
            <span className="year">{movie.year}</span>
            {movie.genres.join(", ")}
          </p>

          {movie.overview ? (
            <p className="overview">{movie.overview}</p>
          ) : (
            <p className="overview overview-empty">No description yet.</p>
          )}

          <section className="rating">
            <h2>Your rating</h2>
            {currentUser ? (
              <>
                <StarRating value={myRating} onRate={handleRate} />
                <p className="rating-note" aria-live="polite">
                  {saveMessage ||
                    (myRating
                      ? `You rated this ${myRating} out of 5.`
                      : "Not rated yet. Click the left or right half of a star for half ratings.")}
                </p>
              </>
            ) : (
              <p className="rating-note">
                <Link to="/login" className="inline-link">Sign in</Link> to rate this movie.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}