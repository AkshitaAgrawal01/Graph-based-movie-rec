import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import styles from './Auth.module.css';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, password, displayName);
      navigate('/movies', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Register</h2>
      {error && <ErrorMessage message={error} />}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.group}>
          <label>Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className={styles.group}>
          <label>Display Name</label>
          <input type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>
        <div className={styles.group}>
          <label>Password</label>
          <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit" className={styles.button}>Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
};

export default RegisterPage;
