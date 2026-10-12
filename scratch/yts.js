async function test() {
  const imdbId = 'tt0114709'; // Toy Story
  const res = await fetch(`https://yts.mx/api/v2/movie_details.json?imdb_id=${imdbId}`);
  const json = await res.json();
  if (json.data && json.data.movie) {
    console.log(json.data.movie.medium_cover_image);
  } else {
    console.log("Not found in YTS");
  }
}
test();
