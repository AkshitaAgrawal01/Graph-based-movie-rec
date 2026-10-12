import client from './client.js';

export const rateMovie = async (movieId, score) => {
  const response = await client.post('/ratings', { movieId, rating: score });
  return response.data;
};

export const getMyRatings = async () => {
  const response = await client.get('/ratings');
  // Map Movie-Rec's ratings response to match Mini-Project
  return { 
    items: response.data.ratings.map(r => ({
      ...r,
      releaseYear: r.year,
      posterPath: r.posterUrl,
      score: r.rating
    }))
  };
};
