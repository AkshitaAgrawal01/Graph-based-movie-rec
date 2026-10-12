/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMyRatings, rateMovie as apiRateMovie } from '../api/ratings.api.js';
import { AuthContext } from './AuthContext.jsx';

const RatingContext = createContext();

export function RatingProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [ratingsMap, setRatingsMap] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRatingsMap(new Map());
      setLoading(false);
      return;
    }
    
    setLoading(true);
    getMyRatings()
      .then(data => {
        const map = new Map();
        data.items.forEach(r => map.set(r.movieId, r.score));
        setRatingsMap(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const rateMovie = useCallback(async (movieId, score) => {
    // Optimistic update
    setRatingsMap(prev => {
      const next = new Map(prev);
      next.set(movieId, score);
      return next;
    });

    try {
      await apiRateMovie(movieId, score);
    } catch (err) {
      // Revert on error
      setRatingsMap(prev => {
        const next = new Map(prev);
        next.delete(movieId);
        return next;
      });
      throw err;
    }
  }, []);

  return (
    <RatingContext.Provider value={{ ratingsMap, rateMovie, loading }}>
      {children}
    </RatingContext.Provider>
  );
}

export function useRatings() {
  return useContext(RatingContext);
}
