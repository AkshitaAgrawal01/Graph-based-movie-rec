import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMovies } from '../hooks/useMovies.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { getMovies, getTrendingMovies } from '../api/movies.api.js';
import { getRecommendations } from '../api/recommendations.api.js';
import client from '../api/client.js';
import { AuthContext } from '../context/AuthContext.jsx';
import MovieGrid from '../components/movies/MovieGrid.jsx';
import MovieGridSkeleton from '../components/movies/MovieGridSkeleton.jsx';
import Carousel from '../components/movies/Carousel.jsx';
import SearchBar from '../components/movies/SearchBar.jsx';
import GenreFilter from '../components/movies/GenreFilter.jsx';
import YearFilter from '../components/movies/YearFilter.jsx';
import RatingFilter from '../components/movies/RatingFilter.jsx';
import Pagination from '../components/common/Pagination.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import styles from './CatalogPage.module.css';

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(AuthContext);

  const page = parseInt(searchParams.get('page')) || 1;
  const initialQ = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  const year = searchParams.get('year') || '';
  const minRating = searchParams.get('minRating') || '';

  const [query, setQuery] = useState(initialQ);
  const debouncedQuery = useDebounce(query, 350);
  const browsing = !debouncedQuery && !genre && !year && !minRating;

  useEffect(() => {
    const currentQ = searchParams.get('q') || '';
    if (debouncedQuery === currentQ) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedQuery) next.set('q', debouncedQuery);
        else next.delete('q');
        next.set('page', '1');
        return next;
      },
      { replace: true }
    );
  }, [debouncedQuery, searchParams, setSearchParams]);

  const {
    movies: searchResults,
    total,
    loading: searchLoading,
    error: searchError,
  } = useMovies(page, debouncedQuery, genre, year, minRating, !browsing);

  const [carousels, setCarousels] = useState(null);
  const [carouselsLoading, setCarouselsLoading] = useState(true);

  useEffect(() => {
    if (!browsing) return;

    const fetchCarousels = async () => {
      setCarouselsLoading(true);
      try {
        const baseRequests = [
          getTrendingMovies().catch(() => []),
          getMovies({ limit: 20, genre: 'Action' }),
          getMovies({ limit: 20, genre: 'Drama' }),
          getMovies({ limit: 20, genre: 'Comedy' }),
          client.get('/ratings/recent').then((r) => ({
            movies: r.data.movies.map((m) => ({
              ...m,
              releaseYear: m.year,
              posterPath: m.posterUrl,
            })),
          })),
        ];

        const personalRecsPromise = user
          ? getRecommendations().catch(() => null)
          : Promise.resolve(null);

        const myHighRatedPromise = user
          ? client
              .get('/ratings')
              .then((r) => {
                const top = r.data.ratings
                  .filter((rt) => rt.rating >= 4)
                  .slice(0, 1);
                return top[0] || null;
              })
              .catch(() => null)
          : Promise.resolve(null);

        const [results, personalRecs, topRatedMovie] = await Promise.all([
          Promise.allSettled(baseRequests),
          personalRecsPromise,
          myHighRatedPromise,
        ]);

        const trending = results[0].status === 'fulfilled' ? results[0].value : [];
        const action = results[1].status === 'fulfilled' ? results[1].value.movies : [];
        const drama = results[2].status === 'fulfilled' ? results[2].value.movies : [];
        const comedy = results[3].status === 'fulfilled' ? results[3].value.movies : [];
        const recent = results[4].status === 'fulfilled' ? results[4].value.movies : [];

        // If user has a high-rated movie, fetch movies in that movie's primary genre
        let becauseYouLovedMovies = [];
        if (topRatedMovie && topRatedMovie.genres && topRatedMovie.genres.length > 0) {
          try {
            const relRes = await getMovies({ limit: 15, genre: topRatedMovie.genres[0] });
            becauseYouLovedMovies = relRes.movies.filter(
              (m) => m.movieId !== topRatedMovie.movieId
            );
          } catch {
            becauseYouLovedMovies = action;
          }
        }

        setCarousels({
          topPicks: personalRecs?.items?.length > 0 ? personalRecs.items : null,
          trending,
          topRatedMovieTitle: topRatedMovie?.title || null,
          becauseYouLoved: becauseYouLovedMovies,
          action,
          drama,
          comedy,
          recent,
        });
      } catch (e) {
        console.error('Failed to load home rows', e);
      } finally {
        setCarouselsLoading(false);
      }
    };

    fetchCarousels();
  }, [browsing, user]);

  const handlePageChange = (p) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
  };

  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.set('page', '1');
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div>
          <p className={styles.kicker}>Browse the catalog</p>
          <h1 className={styles.heading}>Find something worth watching</h1>
        </div>
        <div className={styles.controls}>
          <SearchBar value={query} onChange={setQuery} />
          <GenreFilter value={genre} onChange={(v) => handleFilterChange('genre', v)} />
          <YearFilter value={year} onChange={(v) => handleFilterChange('year', v)} />
          <RatingFilter value={minRating} onChange={(v) => handleFilterChange('minRating', v)} />
        </div>
      </div>

      {!browsing ? (
        <>
          {searchError && <ErrorMessage message={searchError} />}
          {searchLoading ? (
            <MovieGridSkeleton />
          ) : (
            <>
              <MovieGrid movies={searchResults} />
              <Pagination current={page} total={total} onPageChange={handlePageChange} />
            </>
          )}
        </>
      ) : (
        <>
          {carouselsLoading ? (
            <MovieGridSkeleton />
          ) : (
            <div className={styles.carouselsWrapper}>
              {carousels?.topPicks && (
                <Carousel title="🎯 Top picks for you" movies={carousels.topPicks} />
              )}
              {carousels?.trending && carousels.trending.length > 0 && (
                <Carousel title="🔥 Trending Now (TMDB)" movies={carousels.trending} />
              )}
              {carousels?.topRatedMovieTitle && carousels?.becauseYouLoved?.length > 0 && (
                <Carousel
                  title={`❤️ Because you loved "${carousels.topRatedMovieTitle}"`}
                  movies={carousels.becauseYouLoved}
                />
              )}
              <Carousel title="💥 Action" movies={carousels?.action} />
              <Carousel title="🎭 Drama" movies={carousels?.drama} />
              <Carousel title="😂 Comedy" movies={carousels?.comedy} />
              <Carousel title="🕐 Recently reviewed" movies={carousels?.recent} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CatalogPage;
