import styles from './GenreFilter.module.css'; // reuse CSS

const YearFilter = ({ value, onChange }) => {
  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

  return (
    <select 
      className={styles.select} 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter by year"
    >
      <option value="">All Years</option>
      {years.map(y => (
        <option key={y} value={y}>{y}</option>
      ))}
      <option value="older">Older</option>
    </select>
  );
};

export default YearFilter;
