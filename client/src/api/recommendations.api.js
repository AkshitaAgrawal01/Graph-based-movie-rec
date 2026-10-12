import client from './client.js';

export const getRecommendations = async () => {
  const response = await client.get('/recommendations');
  const { items, fallback } = response.data;
  
  if (items.length === 0) {
    return { items: [], isFallback: fallback };
  }

  const ids = items.map((item) => item.movieId).join(",");
  const movieRes = await client.get(`/movies?ids=${ids}`);
  const movies = movieRes.data.movies;

  const infoByMovieId = new Map(items.map((item) => [item.movieId, { score: item.score, explanation: item.explanation }]));
  const merged = movies
    .map((movie) => {
      const info = infoByMovieId.get(movie.movieId);
      return {
        ...movie,
        releaseYear: movie.year,
        posterPath: movie.posterUrl,
        affinityScore: info?.score,
        explanation: info?.explanation
      };
    })
    .sort((a, b) => b.affinityScore - a.affinityScore);

  return { items: merged, isFallback: fallback };
};
