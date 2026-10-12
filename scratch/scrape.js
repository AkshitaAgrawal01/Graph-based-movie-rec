async function test() {
  const res = await fetch('https://www.themoviedb.org/movie/862', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const match = html.match(/og:image" content="(.*?)"/);
  console.log(match ? match[1] : html.substring(0, 500));
}
test();
