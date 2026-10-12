import { useEffect, useState } from 'react';
import { lookupPoster, resolvePosterUrl } from '../../utils/poster.js';
import styles from './PosterImage.module.css';

const PosterImage = ({ path, alt, className, movieId = 0, year }) => {
  const [src, setSrc] = useState(() => resolvePosterUrl(path));
  const [status, setStatus] = useState(() => (resolvePosterUrl(path) ? 'loading' : 'lookup'));

  useEffect(() => {
    const resolved = resolvePosterUrl(path);
    if (resolved) {
      setSrc(resolved);
      setStatus('loading');
      return undefined;
    }

    let cancelled = false;
    setSrc(null);
    setStatus('lookup');

    lookupPoster({ title: alt, year, movieId }).then((url) => {
      if (cancelled) return;
      if (url) {
        setSrc(url);
        setStatus('loading');
      } else {
        setStatus('fallback');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [path, alt, year, movieId]);

  const handleError = async () => {
    const resolved = resolvePosterUrl(path);
    if (src && src === resolved) {
      const url = await lookupPoster({ title: alt, year, movieId });
      if (url && url !== src) {
        setSrc(url);
        setStatus('loading');
        return;
      }
    }
    setStatus('fallback');
  };

  const showImage = src && status !== 'fallback';

  return (
    <div className={`${styles.frame} ${className || ''}`}>
      {(status === 'loading' || status === 'lookup') && (
        <div className={styles.skeleton} aria-hidden="true" />
      )}
      {showImage && (
        <img
          src={src}
          alt={alt}
          className={`${styles.poster} ${status === 'ready' ? styles.ready : ''}`}
          onLoad={() => setStatus('ready')}
          onError={handleError}
          loading="lazy"
        />
      )}
      {status === 'fallback' && (
        <div className={styles.fallback} role="img" aria-label={alt}>
          <span className={styles.fallbackTitle}>{alt}</span>
        </div>
      )}
    </div>
  );
};

export default PosterImage;
