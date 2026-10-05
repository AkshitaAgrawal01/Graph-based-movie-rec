import { Link } from "react-router-dom";
import Poster from "./Poster.jsx";
import "./MovieCard.css";

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie.movieId}`} className="card">
      <Poster movie={movie} />
      <div className="card-title">{movie.title}</div>
      <div className="card-meta">
        <span className="year">{movie.year}</span>
        {movie.genres.join(", ")}
      </div>
    </Link>
  );
}