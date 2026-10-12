import styles from './MovieGridSkeleton.module.css';

const MovieGridSkeleton = ({ count = 20 }) => {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.imagePlaceholder} />
          <div className={styles.textPlaceholder} />
          <div className={styles.textPlaceholderShort} />
          <div className={styles.starsPlaceholder} />
        </div>
      ))}
    </div>
  );
};

export default MovieGridSkeleton;
