import styles from './GenreFilter.module.css';

const RatingFilter = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={styles.select}
      aria-label="Filter by minimum rating"
    >
      <option value="">Any Rating</option>
      <option value="4.5">★ 4.5+ Stars</option>
      <option value="4.0">★ 4.0+ Stars</option>
      <option value="3.5">★ 3.5+ Stars</option>
      <option value="3.0">★ 3.0+ Stars</option>
    </select>
  );
};

export default RatingFilter;
