import "./Poster.css";

export default function Poster({ movie, large = false }) {
  if (movie.posterUrl) {
    return <img className="poster" src={movie.posterUrl} alt="" />;
  }

  const tone = `tone-${movie.movieId % 4}`;
  return (
    <div
      className={`poster poster-fallback ${tone} ${large ? "poster-large" : ""}`}
      aria-hidden="true"
    >
      <span className="poster-title">{movie.title}</span>
    </div>
  );
}