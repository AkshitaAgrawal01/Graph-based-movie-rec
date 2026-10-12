import MovieCard from './MovieCard.jsx';
import styles from './MovieGrid.module.css';

const MovieGrid = ({ movies }) => {
  if (!movies?.length) return <p className={styles.empty}>No movies found.</p>;

  return (
    <div className={styles.grid}>
      {movies.map(m => (
        <MovieCard key={m.movieId} movie={m} />
      ))}
    </div>
  );
};

export default MovieGrid;
