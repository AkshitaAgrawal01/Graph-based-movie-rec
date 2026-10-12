import { useState } from 'react';
import { Link } from 'react-router-dom';
import PosterImage from './PosterImage.jsx';
import WhyModal from './WhyModal.jsx';
import StarRating from './StarRating.jsx';
import { useRatings } from '../../context/RatingContext.jsx';
import { useWatchlist } from '../../context/WatchlistContext.jsx';
import styles from './MovieCard.module.css';

const MovieCard = ({ movie }) => {
  const [showWhy, setShowWhy] = useState(false);
  const { ratingsMap, rateMovie } = useRatings();
  const { watchlistSet, toggleWatchlist } = useWatchlist();
  
  const year = movie.releaseYear || movie.year;
  const movieId = movie.movieId || movie.id;
  
  const userRating = ratingsMap ? ratingsMap.get(movieId) || 0 : 0;
  const inWatchlist = watchlistSet ? watchlistSet.has(movieId) : false;

  const handleWhyClick = (e) => {
    e.preventDefault();
    setShowWhy(true);
  };

  const handleWatchlistClick = (e) => {
    e.preventDefault();
    toggleWatchlist(movieId);
  };

  return (
    <>
      <div className={styles.card}>
        <Link to={`/movies/${movieId}`} className={styles.linkWrapper}>
          <div className={styles.imageContainer}>
            <PosterImage
              path={movie.posterPath || movie.posterUrl}
              alt={movie.title}
              movieId={movieId}
              year={year}
            />
            <button 
              className={`${styles.watchlistBtn} ${inWatchlist ? styles.inWatchlist : ''}`}
              onClick={handleWatchlistClick}
              title="Toggle Watchlist"
            >
              {inWatchlist ? '✓' : '+'}
            </button>
          </div>
          <div className={styles.content}>
            <h3 className={styles.title}>{movie.title}</h3>
            <span className={styles.year}>{year || 'Unknown'}</span>
            {movie.affinityScore ? (
              <div className={styles.scoreRow}>
                <div className={styles.score}>Match {movie.affinityScore.toFixed(2)}</div>
                {movie.explanation && (
                  <button className={styles.whyBtn} onClick={handleWhyClick}>Why?</button>
                )}
              </div>
            ) : (
              <div className={styles.scorePlaceholder} aria-hidden="true" />
            )}
          </div>
        </Link>
        <div className={styles.ratingRow}>
          <StarRating 
            movieId={movieId} 
            initialRating={userRating} 
            onRate={(id, val) => rateMovie(id, val)}
          />
        </div>
      </div>
      {showWhy && <WhyModal explanation={movie.explanation} onClose={() => setShowWhy(false)} />}
    </>
  );
};

export default MovieCard;
