import styles from './ErrorMessage.module.css';

const ErrorMessage = ({ message }) => (
  <div className={styles.error}>
    {message}
  </div>
);

export default ErrorMessage;
