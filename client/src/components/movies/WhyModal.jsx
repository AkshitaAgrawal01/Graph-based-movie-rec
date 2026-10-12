import { useState, useEffect } from 'react';
import client from '../../api/client.js';
import styles from './WhyModal.module.css';

const SIM_COLOR = (sim) => {
  if (sim >= 0.5) return '#22c55e';
  if (sim >= 0.25) return '#f59e0b';
  return '#818cf8';
};

const WhyModal = ({ explanation, onClose }) => {
  const [movieTitles, setMovieTitles] = useState({});

  useEffect(() => {
    if (!explanation?.topNeighbors?.length) return;

    const allIds = new Set();
    explanation.topNeighbors.forEach((nb) =>
      nb.sharedMovies?.forEach((id) => allIds.add(id))
    );
    if (allIds.size === 0) return;

    const idsStr = Array.from(allIds).slice(0, 40).join(',');
    client
      .get(`/movies?ids=${idsStr}`)
      .then((res) => {
        const map = {};
        res.data.movies?.forEach((m) => { map[m.movieId] = m.title; });
        setMovieTitles(map);
      })
      .catch(() => {});
  }, [explanation]);

  if (!explanation) return null;

  const { numNeighbors, avgSimilarity, topNeighbors = [] } = explanation;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <h3>Why this movie?</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>

          {/* Summary banner */}
          <div className={styles.summaryBanner}>
            <span className={styles.summaryIcon}>🤝</span>
            <p className={styles.summaryText}>
              Recommended because{' '}
              <strong>{numNeighbors} similar user{numNeighbors !== 1 ? 's' : ''}</strong> with an{' '}
              <strong>{(avgSimilarity ?? 0).toFixed(2)} average similarity</strong> to you rated
              it highly. The higher the similarity, the more your tastes align.
            </p>
          </div>

          {/* Neighbours */}
          {topNeighbors.length > 0 && (
            <>
              <p className={styles.sectionLabel}>Top similar users who liked this</p>
              <div className={styles.neighbors}>
                {topNeighbors.map((nb, i) => {
                  const initials = `U${i + 1}`;
                  const sharedTitles = nb.sharedMovies
                    ?.slice(0, 5)
                    .map((id) => movieTitles[id] || null)
                    .filter(Boolean);
                  const extra =
                    nb.sharedMovies?.length > 5
                      ? nb.sharedMovies.length - 5
                      : 0;

                  return (
                    <div key={i} className={styles.neighborCard}>
                      <div className={styles.neighborHeader}>
                        <div className={styles.userIcon}>{initials}</div>
                        <span className={styles.neighborName}>
                          User ···{nb.neighborId ? nb.neighborId.slice(-6) : i}
                        </span>
                        <div className={styles.badges}>
                          <span
                            className={`${styles.badge} ${styles.badgeSim}`}
                            style={{ color: SIM_COLOR(nb.similarity) }}
                          >
                            {(nb.similarity ?? 0).toFixed(2)} similarity
                          </span>
                          <span className={`${styles.badge} ${styles.badgeRating}`}>
                            ★ {nb.rating} rated
                          </span>
                        </div>
                      </div>

                      {sharedTitles && sharedTitles.length > 0 && (
                        <div className={styles.sharedMovies}>
                          <em>Both liked:</em>
                          {sharedTitles.map((title, j) => (
                            <span key={j} className={styles.moviePill}>{title}</span>
                          ))}
                          {extra > 0 && (
                            <span className={styles.moviePill}>+{extra} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhyModal;
