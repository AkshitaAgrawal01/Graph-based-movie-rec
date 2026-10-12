import { useState, useEffect } from 'react';
import { getWatchlist } from '../api/watchlist.api.js';
import MovieGrid from '../components/movies/MovieGrid.jsx';
import MovieGridSkeleton from '../components/movies/MovieGridSkeleton.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import styles from './RecommendationsPage.module.css'; // Reuse same layout

const WatchlistPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await getWatchlist();
        setData(res);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load watchlist');
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  if (loading) return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Watchlist</h2>
      <MovieGridSkeleton />
    </div>
  );
  
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Watchlist</h2>
      {data?.items?.length === 0 ? (
        <p>Your watchlist is empty. Add movies by clicking the + icon on a movie card!</p>
      ) : (
        <MovieGrid movies={data?.items || []} />
      )}
    </div>
  );
};

export default WatchlistPage;
