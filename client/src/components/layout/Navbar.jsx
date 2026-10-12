import { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/movies');
  };

  const linkClass = ({ isActive }) =>
    `${styles.link} ${isActive ? styles.active : ''}`;

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>MovieRec</Link>
        <nav className={styles.nav}>
          <ThemeToggle />
          <NavLink to="/movies" className={linkClass}>Catalog</NavLink>
          {user ? (
            <>
              <NavLink to="/recommendations" className={linkClass}>For you</NavLink>
              <NavLink to="/watchlist" className={linkClass}>Watchlist</NavLink>
              <span className={styles.welcome}>Hi, {user.name}</span>
              <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Login</NavLink>
              <NavLink to="/register" className={styles.registerBtn}>Register</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
