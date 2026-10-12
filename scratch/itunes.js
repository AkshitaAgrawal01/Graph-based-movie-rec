async function test() {
  const url = 'https://itunes.apple.com/search?term=' + encodeURIComponent('Jurassic Park') + '&entity=movie&limit=1';
  console.log(url);
  const res = await fetch(url);
  const json = await res.json();
  if (json.results && json.results.length > 0) {
    const poster = json.results[0].artworkUrl100.replace('100x100bb', '600x900bb');
    console.log(poster);
  } else {
    console.log("Not found");
  }
}
test();
