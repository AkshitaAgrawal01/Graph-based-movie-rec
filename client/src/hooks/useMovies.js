import { useState, useEffect } from 'react';
import { getMovies } from '../api/movies.api.js';

export function useMovies(page, query, genre, year, minRating, enabled = true) {
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMovies({ page, limit: 20, q: query, genre, year, minRating });
        if (mounted) {
          setMovies(data.movies);
          setTotal(data.total);
        }
      } catch (err) {
        if (mounted) setError(err.response?.data?.error?.message || 'Failed to fetch movies');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMovies();
    return () => {
      mounted = false;
    };
  }, [page, query, genre, year, minRating, enabled]);

  return { movies, total, loading, error };
}
