import styles from './GenreFilter.module.css';

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Horror', 'IMAX',
  'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
];

const GenreFilter = ({ value, onChange }) => {
  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={styles.select}
    >
      <option value="">All Genres</option>
      {GENRES.map(g => (
        <option key={g} value={g}>{g}</option>
      ))}
    </select>
  );
};

export default GenreFilter;
