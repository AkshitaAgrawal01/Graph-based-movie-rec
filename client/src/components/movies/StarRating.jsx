import { useState, useEffect } from 'react';
import { rateMovie } from '../../api/ratings.api.js';
import styles from './StarRating.module.css';

const StarRating = ({ movieId, initialRating = 0, onRate }) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const handleRate = async (value) => {
    // Optimistic update
    const prevRating = rating;
    setRating(value);
    try {
      if (onRate) {
        await onRate(movieId, value);
      } else {
        await rateMovie(movieId, value);
      }
    } catch (err) {
      // Revert on failure
      setRating(prevRating);
      console.error('Failed to rate movie:', err);
    }
  };

  const handleMouseMove = (e, index) => {
    const { left, width } = e.target.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    const value = index + (percent > 0.5 ? 1 : 0.5);
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const renderStar = (index) => {
    const current = hoverRating || rating;
    const filled = current >= index + 1;
    const half = current === index + 0.5;

    return (
      <span
        key={index}
        className={`${styles.star} ${filled || half ? styles.active : ''} ${half ? styles.half : ''}`}
        onMouseMove={(e) => handleMouseMove(e, index)}
        onClick={() => handleRate(hoverRating)}
        role="button"
        aria-label={`Rate ${index + 1} stars`}
      >
        ★
      </span>
    );
  };

  return (
    <div className={styles.starRating} onMouseLeave={handleMouseLeave}>
      {[0, 1, 2, 3, 4].map(renderStar)}
      <span className={styles.valueDisplay}>
        {rating > 0 ? rating.toFixed(1) : 'Rate'}
      </span>
    </div>
  );
};

export default StarRating;
