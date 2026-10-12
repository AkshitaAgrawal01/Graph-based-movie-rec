const movieInfo = require('movie-info');

async function test() {
  try {
    const info = await movieInfo('Toy Story');
    console.log(info);
  } catch (err) {
    console.error(err);
  }
}
test();
