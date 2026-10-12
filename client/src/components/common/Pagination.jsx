import styles from './Pagination.module.css';

const Pagination = ({ current, total, onPageChange }) => {
  const totalPages = Math.ceil(total / 20);
  
  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <button 
        disabled={current === 1} 
        onClick={() => onPageChange(current - 1)}
        className={styles.button}
      >
        Previous
      </button>
      <span className={styles.info}>Page {current} of {totalPages}</span>
      <button 
        disabled={current === totalPages} 
        onClick={() => onPageChange(current + 1)}
        className={styles.button}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
