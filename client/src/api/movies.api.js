import client from './client.js';

const mapMovie = (m) => ({
  ...m,
  releaseYear: m.year,
  posterPath: m.posterUrl,
  tmdbId: m.tmdbId,
  averageRating: m.averageRating,
  ratingCount: m.ratingCount
});

export const getMovies = async ({ page = 1, limit = 20, q = '', genre, year, minRating } = {}) => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('pageSize', limit);
  if (q) params.append('search', q);
  if (genre) params.append('genre', genre);
  if (year) params.append('year', year);
  if (minRating) params.append('minRating', minRating);

  const response = await client.get(`/movies?${params.toString()}`);
  response.data.movies = response.data.movies.map(mapMovie);
  return response.data;
};

export const getTrendingMovies = async () => {
  const response = await client.get('/movies/trending');
  return response.data.movies.map(mapMovie);
};

export const getMovie = async (movieId) => {
  const response = await client.get(`/movies/${movieId}`);
  return mapMovie(response.data);
};
