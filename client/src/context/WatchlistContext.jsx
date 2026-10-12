/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getWatchlist, addToWatchlist as apiAdd, removeFromWatchlist as apiRemove } from '../api/watchlist.api.js';
import { AuthContext } from './AuthContext.jsx';

const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [watchlistSet, setWatchlistSet] = useState(new Set());

  useEffect(() => {
    if (!user) {
      setWatchlistSet(new Set());
      return;
    }
    
    getWatchlist()
      .then(data => {
        setWatchlistSet(new Set(data.items.map(m => m.movieId)));
      })
      .catch(console.error);
  }, [user]);

  const toggleWatchlist = useCallback(async (movieId) => {
    setWatchlistSet(prev => {
      const next = new Set(prev);
      if (next.has(movieId)) {
        next.delete(movieId);
        apiRemove(movieId).catch(() => setWatchlistSet(new Set(prev))); // revert on fail
      } else {
        next.add(movieId);
        apiAdd(movieId).catch(() => setWatchlistSet(new Set(prev)));
      }
      return next;
    });
  }, []);

  return (
    <WatchlistContext.Provider value={{ watchlistSet, toggleWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}
