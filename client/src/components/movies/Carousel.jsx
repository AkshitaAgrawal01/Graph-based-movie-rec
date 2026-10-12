import { useRef } from 'react';
import MovieCard from './MovieCard.jsx';
import styles from './Carousel.module.css';

const Carousel = ({ title, movies }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth + 100 : scrollLeft + clientWidth - 100;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className={styles.carouselContainer}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.wrapper}>
        <button
          type="button"
          className={`${styles.navBtn} ${styles.left}`}
          onClick={() => scroll('left')}
          aria-label={`Scroll ${title} left`}
        >
          ‹
        </button>
        <div className={styles.slider} ref={scrollRef}>
          {movies.map(movie => (
            <div key={movie.movieId || movie.id} className={styles.slide}>
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.navBtn} ${styles.right}`}
          onClick={() => scroll('right')}
          aria-label={`Scroll ${title} right`}
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Carousel;
