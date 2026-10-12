const TMDB_BASE = 'https://image.tmdb.org/t/p/w500';
const memoryCache = new Map();
const inflight = new Map();
const STORAGE_PREFIX = 'movierec:poster:';

export function resolvePosterUrl(path) {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `${TMDB_BASE}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

function cleanTitle(title = '') {
  return title.replace(/\s*\(\d{4}\)\s*$/, '').trim();
}

function cacheKey({ movieId, title, year }) {
  return String(movieId || `${cleanTitle(title)}:${year || ''}`);
}

function readStored(key) {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    return null;
  }
}

function writeStored(key, url) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, url);
  } catch {
    // quota / private mode — memory cache is enough for the session
  }
}

function pickArtwork(results, year) {
  if (!results?.length) return null;

  const yearStr = year ? String(year) : null;
  const match =
    (yearStr && results.find((r) => String(r.releaseDate || '').startsWith(yearStr))) ||
    results[0];

  const art = match?.artworkUrl100;
  if (!art) return null;
  return art.replace('100x100bb', '600x600bb').replace('100x100', '600x600');
}

export async function lookupPoster({ title, year, movieId }) {
  const key = cacheKey({ movieId, title, year });
  if (memoryCache.has(key)) return memoryCache.get(key);

  const stored = readStored(key);
  if (stored) {
    memoryCache.set(key, stored);
    return stored;
  }

  if (inflight.has(key)) return inflight.get(key);

  const request = (async () => {
    const term = cleanTitle(title);
    if (!term) {
      memoryCache.set(key, null);
      return null;
    }

    const params = new URLSearchParams({
      term,
      entity: 'movie',
      media: 'movie',
      limit: '8',
    });

    const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
    if (!response.ok) {
      memoryCache.set(key, null);
      return null;
    }

    const data = await response.json();
    const url = pickArtwork(data.results, year);
    memoryCache.set(key, url);
    if (url) writeStored(key, url);
    return url;
  })().catch(() => {
    memoryCache.set(key, null);
    return null;
  }).finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, request);
  return request;
}
