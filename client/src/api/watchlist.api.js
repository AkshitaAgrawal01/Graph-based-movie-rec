import client from './client.js';

export const getWatchlist = async () => {
  const response = await client.get('/watchlist');
  return response.data;
};

export const addToWatchlist = async (movieId) => {
  const response = await client.post('/watchlist', { movieId });
  return response.data;
};

export const removeFromWatchlist = async (movieId) => {
  const response = await client.delete(`/watchlist/${movieId}`);
  return response.data;
};
