import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import styles from './SearchBar.module.css';

const SearchBar = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await client.get(`/movies?search=${encodeURIComponent(value)}&pageSize=5`);
        setSuggestions(res.data.movies || []);
      } catch (err) {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (movieId) => {
    setShowDropdown(false);
    navigate(`/movies/${movieId}`);
  };

  return (
    <div className={styles.wrap} ref={wrapperRef}>
      <span className={styles.icon} aria-hidden="true">🔍</span>
      <input
        type="search"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder="Search movies by title..."
        className={styles.input}
        aria-label="Search movies"
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className={styles.dropdown}>
          {suggestions.map(m => (
            <li key={m.movieId} onClick={() => handleSelect(m.movieId)} className={styles.dropdownItem}>
              {m.title} <span className={styles.year}>({m.year})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
