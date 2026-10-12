const movieArt = require('movie-art');

async function test() {
  const url1 = await movieArt('The Matrix', { year: 1999 });
  const url2 = await movieArt('Jurassic Park');
  console.log(url1);
  console.log(url2);
}
test();
