import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMovie } from '../api/movies.api.js';
import { useRatings } from '../context/RatingContext.jsx';
import { useWatchlist } from '../context/WatchlistContext.jsx';
import PosterImage from '../components/movies/PosterImage.jsx';
import StarRating from '../components/movies/StarRating.jsx';
import Carousel from '../components/movies/Carousel.jsx';
import Spinner from '../components/common/Spinner.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import styles from './MovieDetailPage.module.css';

const MovieDetailPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [tmdbData, setTmdbData] = useState(null);
  const [recs, setRecs] = useState([]);
  const { ratingsMap, rateMovie } = useRatings();
  const { watchlistSet, toggleWatchlist } = useWatchlist();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const movieId = Number(id);
  const userRating = ratingsMap ? ratingsMap.get(movieId) || 0 : 0;
  const inWatchlist = watchlistSet ? watchlistSet.has(movieId) : false;

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const m = await getMovie(id);
        setMovie(m);
        
        import('../api/recommendations.api.js').then(mod => {
          mod.getRecommendations().then(r => setRecs(r.items)).catch(() => {});
        });
        
        if (m.tmdbId) {
          try {
            const { default: client } = await import('../api/client.js');
            const tmdbRes = await client.get(`/movies/${m.movieId}/tmdb`);
            if (tmdbRes.data && !tmdbRes.data.status_message) {
              setTmdbData(tmdbRes.data);
            }
          } catch (e) {
            console.error('Failed to fetch TMDB details', e);
          }
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load movie');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!movie) return <ErrorMessage message="Movie not found" />;

  const cast = tmdbData?.credits?.cast?.slice(0, 6) || [];
  const trailer = tmdbData?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const overview = tmdbData?.overview || movie.overview;

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <div className={styles.posterCol}>
          <PosterImage
            path={movie.posterPath}
            alt={movie.title}
            className={styles.poster}
            movieId={movie.movieId}
            year={movie.releaseYear}
          />
          <div className={styles.rateSection}>
            <h3>Rate this movie</h3>
            <StarRating movieId={movie.movieId} initialRating={userRating} onRate={(i, v) => rateMovie(i, v)} />
          </div>
        </div>
        
        <div className={styles.infoCol}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>
              {movie.title} <span className={styles.year}>({movie.releaseYear})</span>
            </h1>
            <button 
              className={`${styles.watchlistBtnLarge} ${inWatchlist ? styles.inWatchlist : ''}`}
              onClick={() => toggleWatchlist(movieId)}
            >
              {inWatchlist ? '✓ Added to Watchlist' : '+ Add to Watchlist'}
            </button>
          </div>
          <div className={styles.metaRow}>
            {movie.averageRating > 0 && (
              <span className={styles.avgRating}>
                ★ {movie.averageRating.toFixed(1)} 
                <span className={styles.ratingCount}>({movie.ratingCount} ratings)</span>
              </span>
            )}
            <div className={styles.genres}>
              {movie.genres?.map((g) => (
                <span key={g} className={styles.badge}>{g}</span>
              ))}
            </div>
          </div>
          
          <div className={styles.overviewSection}>
            <h3>Overview</h3>
            <p className={styles.overview}>
              {overview || 'No overview available yet.'}
            </p>
          </div>

          {cast.length > 0 && (
            <div className={styles.castSection}>
              <h3>Top Cast</h3>
              <div className={styles.castGrid}>
                {cast.map(actor => (
                  <div key={actor.id} className={styles.castMember}>
                    {actor.profile_path ? (
                      <img src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} alt={actor.name} />
                    ) : (
                      <div className={styles.noProfile} />
                    )}
                    <span className={styles.actorName}>{actor.name}</span>
                    <span className={styles.character}>{actor.character}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trailer && (
            <div className={styles.trailerSection}>
              <h3>Trailer</h3>
              <div className={styles.videoWrapper}>
                <iframe 
                  src={`https://www.youtube.com/embed/${trailer.key}`} 
                  title="Trailer" 
                  frameBorder="0" 
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {recs.length > 0 && (
        <div className={styles.similarSection}>
          <Carousel title="Users like you also liked" movies={recs} />
        </div>
      )}
    </div>
  );
};

export default MovieDetailPage;
