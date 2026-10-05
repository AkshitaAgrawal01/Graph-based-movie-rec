import { useEffect, useState } from "react";
import { getMovies } from "../api/movies.js";
import MovieCard from "../components/MovieCard.jsx";
import "./Catalog.css";

export default function Catalog() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ movies: [], totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await getMovies({ search, page });
        if (!ignore) setData(result);
      } catch (err) {
        if (!ignore) setError("We couldn't load the movies. Check your connection and try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [search, page]);

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(1); // a new search always starts from page 1
  }

  return (
    <div>
      <h1 className="page-title">Movies</h1>

      <input
        className="search"
        type="search"
        aria-label="Search movies by title"
        placeholder="Search by title"
        value={search}
        onChange={handleSearchChange}
      />

      <p className="count" aria-live="polite">
        {!loading && !error && `${data.total} ${data.total === 1 ? "title" : "titles"}`}
      </p>

      {error && <p className="status">{error}</p>}
      {loading && <p className="status">Loading movies</p>}
      {!loading && !error && data.movies.length === 0 && (
        <p className="status">Nothing matches "{search}". Try a shorter or different title.</p>
      )}

      <div className="grid">
        {data.movies.map((m) => (
          <MovieCard key={m.movieId} movie={m} />
        ))}
      </div>

      <div className="pager">
        <button onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</button>
        <span>Page {page} of {data.totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page >= data.totalPages}>Next</button>
      </div>
    </div>
  );
}