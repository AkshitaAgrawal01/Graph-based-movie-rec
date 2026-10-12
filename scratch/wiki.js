async function test() {
  const title = encodeURIComponent('Toy Story');
  const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${title}&prop=pageimages&format=json&pithumbsize=500`);
  const json = await res.json();
  const pages = json.query.pages;
  const pageId = Object.keys(pages)[0];
  if (pageId !== '-1' && pages[pageId].thumbnail) {
    console.log(pages[pageId].thumbnail.source);
  } else {
    console.log("Not found");
  }
}
test();
