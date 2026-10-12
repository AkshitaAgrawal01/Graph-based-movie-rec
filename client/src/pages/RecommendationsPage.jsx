import { useState, useEffect } from 'react';
import { getRecommendations } from '../api/recommendations.api.js';
import { useRatings } from '../context/RatingContext.jsx';
import MovieGrid from '../components/movies/MovieGrid.jsx';
import MovieGridSkeleton from '../components/movies/MovieGridSkeleton.jsx';
import NeighborGraph from '../components/movies/NeighborGraph.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import styles from './RecommendationsPage.module.css';

const RecommendationsPage = () => {
  const [data, setData] = useState(null);
  const { ratingsMap } = useRatings();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await getRecommendations();
        setData(res);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

  if (loading) return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Recommendations</h2>
      <MovieGridSkeleton />
    </div>
  );
  if (error) return <ErrorMessage message={error} />;

  const ratingCount = ratingsMap ? ratingsMap.size : 0;
  const needed = Math.max(0, 8 - ratingCount);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Recommendations</h2>
      {data?.isFallback && (
        <div className={styles.fallbackNotice}>
          <h3>Cold Start: We need more data!</h3>
          <p>
            You have rated {ratingCount} movies. Please rate at least <strong>{needed} more movies</strong> to unlock your highly personalised recommendations!
          </p>
          <p>Here are some popular movies to get you started:</p>
        </div>
      )}
      <MovieGrid movies={data?.items || []} />
      
      {!data?.isFallback && <NeighborGraph />}
    </div>
  );
};

export default RecommendationsPage;
