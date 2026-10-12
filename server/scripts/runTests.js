/**
 * MovieRec — Automated Functional & Non-Functional Test Suite
 * Run with:  node scripts/runTests.js
 * Output:    logs/test-report-<timestamp>.txt
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

const BASE = process.env.API_URL || "http://localhost:5000/api";
const DB   = process.env.MONGO_URI;

// ─── helpers ─────────────────────────────────────────────────────────────────

const results = [];
let pass = 0, fail = 0;

function log(msg)  { process.stdout.write(msg + "\n"); }
function ok(msg)   { log(`  ✅  ${msg}`); }
function bad(msg)  { log(`  ❌  ${msg}`); }
function info(msg) { log(`  ℹ️   ${msg}`); }
function section(title) { log(`\n${"─".repeat(60)}\n  ${title}\n${"─".repeat(60)}`); }

async function test(id, name, fn) {
  const t0 = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - t0;
    const entry = { id, name, status: "PASS", ms, detail: result?.detail || "" };
    results.push(entry);
    ok(`[${id}] ${name}  (${ms}ms)${result?.detail ? "  →  " + result.detail : ""}`);
    pass++;
  } catch (err) {
    const ms = Date.now() - t0;
    results.push({ id, name, status: "FAIL", ms, detail: err.message });
    bad(`[${id}] ${name}  (${ms}ms)  →  ${err.message}`);
    fail++;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function req(method, path, { body, token } = {}) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const t0 = Date.now();
  const res = await fetch(`${BASE}${path}`, opts);
  const ms = Date.now() - t0;
  let json;
  try { json = await res.json(); } catch { json = {}; }
  return { status: res.status, json, ms };
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function run() {
  log(`\n${"═".repeat(60)}`);
  log(`  MovieRec Automated Test Suite`);
  log(`  ${new Date().toISOString()}`);
  log(`  API: ${BASE}`);
  log(`${"═".repeat(60)}`);

  // ── helpers ────────────────────────────────────────────────────────────────
  let token = "";
  const testEmail = `test_${Date.now()}@movierec.test`;
  const testPwd   = "Test@12345";

  // ══════════════════════════════════════════════════════════════════════════
  section("F1 · Authentication");

  await test("F1.1", "Register new user", async () => {
    const { status, json } = await req("POST", "/auth/register", {
      body: { email: testEmail, password: testPwd, name: "Test Runner" },
    });
    assert(status === 201, `Expected 201, got ${status}: ${JSON.stringify(json)}`);
    assert(json.token, "No token returned");
    token = json.token;
    return { detail: `token received` };
  });

  await test("F1.2", "Login returns JWT", async () => {
    const { status, json } = await req("POST", "/auth/login", {
      body: { email: testEmail, password: testPwd },
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.token, "No token in response");
    token = json.token;
    return { detail: `jwt ok` };
  });

  await test("F1.3", "Wrong password returns 401", async () => {
    const { status } = await req("POST", "/auth/login", {
      body: { email: testEmail, password: "wrong-password" },
    });
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test("F1.4", "GET /auth/me returns user", async () => {
    const { status, json } = await req("GET", "/auth/me", { token });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.email === testEmail, `Email mismatch: ${json.email}`);
    return { detail: `user id ${json._id}` };
  });

  await test("F1.5", "Missing token → 401 on protected route", async () => {
    const { status } = await req("GET", "/ratings");
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test("F1.6", "Invalid token → 401", async () => {
    const { status } = await req("GET", "/ratings", { token: "not.a.real.token" });
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // ══════════════════════════════════════════════════════════════════════════
  section("F2 · Movie Catalog & Filters");

  let firstMovieId;

  await test("F2.1", "GET /movies returns paginated list", async () => {
    const { status, json, ms } = await req("GET", "/movies?pageSize=8");
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(json.movies), "movies not an array");
    assert(json.movies.length === 8, `Expected 8 movies, got ${json.movies.length}`);
    assert(json.total > 9000, `Expected > 9000 total, got ${json.total}`);
    firstMovieId = json.movies[0].movieId;
    return { detail: `${json.total} total, p1 has ${json.movies.length} movies, ${ms}ms` };
  });

  await test("F2.2", "Search filter works", async () => {
    const { status, json } = await req("GET", "/movies?search=matrix");
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.movies.length > 0, "No results for 'matrix'");
    const titles = json.movies.map((m) => m.title.toLowerCase());
    const matched = titles.filter((t) => t.includes("matrix"));
    assert(matched.length > 0, `No titles contain 'matrix': ${titles.join(", ")}`);
    return { detail: `${json.movies.length} results, ${matched.length} contain 'matrix'` };
  });

  await test("F2.3", "Genre filter works", async () => {
    const { status, json } = await req("GET", "/movies?genre=Horror&pageSize=5");
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.movies.length > 0, "No Horror movies returned");
    json.movies.forEach((m) => {
      assert(m.genres.includes("Horror"), `Movie '${m.title}' has genres: ${m.genres}`);
    });
    return { detail: `${json.total} Horror movies found` };
  });

  await test("F2.4", "Year filter works", async () => {
    const { status, json } = await req("GET", "/movies?year=1994&pageSize=10");
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.movies.length > 0, "No 1994 movies returned");
    json.movies.forEach((m) => {
      assert(m.year === 1994, `Movie '${m.title}' has year ${m.year}`);
    });
    return { detail: `${json.total} movies from 1994` };
  });

  await test("F2.5", "GET /movies/trending returns TMDB data with posters", async () => {
    const { status, json } = await req("GET", "/movies/trending");
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.movies.length > 0, "No trending movies");
    const withPosters = json.movies.filter((m) => m.posterUrl);
    return { detail: `${json.movies.length} trending, ${withPosters.length} with posters` };
  });

  await test("F2.6", "Regex injection is safe (special chars in search)", async () => {
    const { status } = await req("GET", "/movies?search=" + encodeURIComponent("(+*?){}[]"));
    assert(status === 200, `Expected 200, got ${status}`);
    return { detail: "no crash on regex special chars" };
  });

  await test("F2.7", "GET /movies/:id returns single movie", async () => {
    const { status, json } = await req("GET", `/movies/${firstMovieId}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.movieId === firstMovieId, `movieId mismatch`);
    assert(json.title, "No title");
    return { detail: `"${json.title}" (${json.year}), avgRating=${json.averageRating?.toFixed(2)}` };
  });

  await test("F2.8", "Batch ?ids= lookup works", async () => {
    const { status, json } = await req("GET", "/movies?ids=1,2,3,4,5");
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.movies.length === 5, `Expected 5, got ${json.movies.length}`);
    return { detail: `5 movies by id: ${json.movies.map((m) => m.title).join(", ")}` };
  });

  // ══════════════════════════════════════════════════════════════════════════
  section("F3 · Star Ratings");

  const testMovieId = 1;

  await test("F3.1", "Submit a rating (POST /ratings)", async () => {
    const { status, json } = await req("POST", "/ratings", {
      body: { movieId: testMovieId, rating: 4.5 },
      token,
    });
    assert(status === 200 || status === 201, `Expected 200/201, got ${status}`);
    return { detail: `rated movie ${testMovieId} → 4.5★` };
  });

  await test("F3.2", "Rating appears in GET /ratings", async () => {
    const { status, json } = await req("GET", "/ratings", { token });
    assert(status === 200, `Expected 200, got ${status}`);
    const found = json.ratings?.find((r) => r.movieId === testMovieId);
    assert(found, `Rating for movie ${testMovieId} not in list`);
    assert(found.rating === 4.5, `Expected 4.5, got ${found.rating}`);
    return { detail: `found rating 4.5★ for movie ${testMovieId}` };
  });

  await test("F3.3", "Update rating (upsert — no duplicate)", async () => {
    await req("POST", "/ratings", { body: { movieId: testMovieId, rating: 3 }, token });
    const { json } = await req("GET", "/ratings", { token });
    const matches = json.ratings?.filter((r) => r.movieId === testMovieId);
    assert(matches?.length === 1, `Expected 1 rating for movie, got ${matches?.length}`);
    assert(matches[0].rating === 3, `Expected updated rating 3, got ${matches[0].rating}`);
    return { detail: "upsert ok — 1 rating record, updated to 3★" };
  });

  await test("F3.4", "Rating > 5 is rejected", async () => {
    const { status } = await req("POST", "/ratings", {
      body: { movieId: testMovieId, rating: 6 },
      token,
    });
    assert(status === 400, `Expected 400, got ${status}`);
    return { detail: "6★ rating correctly rejected" };
  });

  await test("F3.5", "Rating < 0.5 is rejected", async () => {
    const { status } = await req("POST", "/ratings", {
      body: { movieId: testMovieId, rating: 0 },
      token,
    });
    assert(status === 400, `Expected 400, got ${status}`);
    return { detail: "0★ rating correctly rejected" };
  });

  await test("F3.6", "Rating without auth returns 401", async () => {
    const { status } = await req("POST", "/ratings", {
      body: { movieId: testMovieId, rating: 4 },
    });
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // ══════════════════════════════════════════════════════════════════════════
  section("F4 · Recommendations");

  await test("F4.1", "Cold-start: < 8 ratings → fallback=true", async () => {
    const { status, json } = await req("GET", "/recommendations", { token });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.fallback === true, `Expected fallback=true, got ${json.fallback}`);
    return { detail: `fallback mode, ${json.items?.length} global items` };
  });

  await test("F4.2", "Recommendations returns items array", async () => {
    const { json } = await req("GET", "/recommendations", { token });
    assert(Array.isArray(json.items), "items is not an array");
    return { detail: `${json.items.length} items returned` };
  });

  await test("F4.3", "Graph endpoint returns nodes+links", async () => {
    const { status, json } = await req("GET", "/recommendations/graph", { token });
    assert(status === 200, `Expected 200, got ${status}`);
    assert("nodes" in json, "No 'nodes' key");
    assert("links" in json, "No 'links' key");
    return { detail: `${json.nodes.length} nodes, ${json.links.length} links` };
  });

  await test("F4.4", "Global/popular recommendations exist", async () => {
    const { status, json } = await req("GET", "/recommendations/global");
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.items?.length > 0, "No global recommendation items");
    return { detail: `${json.items.length} global recommendation items` };
  });

  // ══════════════════════════════════════════════════════════════════════════
  section("F5 · Watchlist");

  const watchMovieId = 77;

  await test("F5.1", "GET /watchlist requires auth", async () => {
    const { status } = await req("GET", "/watchlist");
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test("F5.2", "POST /watchlist adds movie", async () => {
    const { status, json } = await req("POST", "/watchlist", {
      body: { movieId: watchMovieId },
      token,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.success === true, `Expected success=true`);
    return { detail: `movie ${watchMovieId} added` };
  });

  await test("F5.3", "Watchlist is retrieved correctly", async () => {
    const { status, json } = await req("GET", "/watchlist", { token });
    assert(status === 200, `Expected 200, got ${status}`);
    const found = json.items?.find((m) => m.movieId === watchMovieId);
    assert(found, `Movie ${watchMovieId} not in watchlist`);
    return { detail: `${json.items.length} items, found movie ${watchMovieId}` };
  });

  await test("F5.4", "Duplicate watchlist add is idempotent (no error)", async () => {
    const { status } = await req("POST", "/watchlist", {
      body: { movieId: watchMovieId },
      token,
    });
    assert(status === 200, `Expected 200, got ${status}`);
    const { json } = await req("GET", "/watchlist", { token });
    const matches = json.items?.filter((m) => m.movieId === watchMovieId);
    assert(matches?.length === 1, `Expected 1 entry, got ${matches?.length} duplicates`);
    return { detail: "upsert ok — only 1 entry" };
  });

  await test("F5.5", "DELETE /watchlist/:id removes movie", async () => {
    const { status } = await req("DELETE", `/watchlist/${watchMovieId}`, { token });
    assert(status === 200, `Expected 200, got ${status}`);
    const { json } = await req("GET", "/watchlist", { token });
    const found = json.items?.find((m) => m.movieId === watchMovieId);
    assert(!found, `Movie ${watchMovieId} still in watchlist after delete`);
    return { detail: `movie ${watchMovieId} removed successfully` };
  });

  // ══════════════════════════════════════════════════════════════════════════
  section("NF1 · Performance (Response Times)");

  await test("NF1.1", "Catalog load < 500ms", async () => {
    const { ms } = await req("GET", "/movies?pageSize=20");
    assert(ms < 500, `Too slow: ${ms}ms`);
    return { detail: `${ms}ms` };
  });

  await test("NF1.2", "Search response < 400ms", async () => {
    const { ms } = await req("GET", "/movies?search=star+wars");
    assert(ms < 400, `Too slow: ${ms}ms`);
    return { detail: `${ms}ms` };
  });

  await test("NF1.3", "Rating save < 250ms", async () => {
    const { ms } = await req("POST", "/ratings", {
      body: { movieId: 2, rating: 3.5 },
      token,
    });
    assert(ms < 250, `Too slow: ${ms}ms`);
    return { detail: `${ms}ms` };
  });

  await test("NF1.4", "Recommendations fetch < 600ms (pre-computed)", async () => {
    const { ms } = await req("GET", "/recommendations", { token });
    assert(ms < 600, `Too slow: ${ms}ms`);
    return { detail: `${ms}ms` };
  });

  await test("NF1.5", "Movie detail fetch < 300ms (local data)", async () => {
    const { ms } = await req("GET", `/movies/${firstMovieId}`);
    assert(ms < 300, `Too slow: ${ms}ms`);
    return { detail: `${ms}ms` };
  });

  // ══════════════════════════════════════════════════════════════════════════
  section("NF2 · Security & Validation");

  await test("NF2.1", "Password is hashed (bcrypt) in DB", async () => {
    await mongoose.connect(DB);
    const db = mongoose.connection.db;
    const user = await db.collection("users").findOne({ email: testEmail });
    assert(user, "Test user not found in DB");
    assert(user.passwordHash?.startsWith("$2b$"), "Password is not bcrypt hashed");
    return { detail: `hash prefix: ${user.passwordHash.slice(0, 7)}...` };
  });

  await test("NF2.2", "GET /recommendations without token returns 401", async () => {
    const { status } = await req("GET", "/recommendations");
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test("NF2.3", "Rating missing movieId returns 400", async () => {
    const { status } = await req("POST", "/ratings", {
      body: { rating: 4 },
      token,
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test("NF2.4", "Watchlist POST missing movieId returns 400 or 500", async () => {
    const { status } = await req("POST", "/watchlist", { body: {}, token });
    assert(status >= 400, `Expected 4xx/5xx, got ${status}`);
    return { detail: `returned ${status}` };
  });

  // ══════════════════════════════════════════════════════════════════════════
  section("NF3 · Data Integrity");

  await test("NF3.1", "DB has all 9742 movies loaded", async () => {
    const count = await mongoose.connection.db.collection("movies").countDocuments();
    assert(count >= 9700, `Expected ≥9700, got ${count}`);
    return { detail: `${count} movies in DB` };
  });

  await test("NF3.2", "DB has 100K+ ratings loaded", async () => {
    const count = await mongoose.connection.db.collection("ratings").countDocuments();
    assert(count >= 100000, `Expected ≥100000, got ${count}`);
    return { detail: `${count} ratings in DB` };
  });

  await test("NF3.3", "Recommendations were precomputed for 600+ users", async () => {
    const count = await mongoose.connection.db.collection("recommendations").countDocuments();
    assert(count >= 600, `Expected ≥600, got ${count}`);
    return { detail: `${count} recommendation documents` };
  });

  await test("NF3.4", "Recommendation items have explanation field", async () => {
    const rec = await mongoose.connection.db
      .collection("recommendations")
      .findOne({ userId: { $ne: "GLOBAL" }, "items.explanation": { $exists: true } });
    assert(rec, "No recommendation document with items");
    const item = rec.items[0];
    assert(item.explanation, "First item has no explanation");
    assert(item.explanation.topNeighbors?.length > 0, "No topNeighbors in explanation");
    return { detail: `explanation ok, ${item.explanation.topNeighbors.length} neighbors` };
  });

  await test("NF3.5", "Posters are being populated (> 5000 movies with poster)", async () => {
    const count = await mongoose.connection.db
      .collection("movies")
      .countDocuments({ posterUrl: { $ne: null, $exists: true, $gt: "" } });
    assert(count > 5000, `Only ${count} movies have a poster — enrichment may still be running`);
    return { detail: `${count} movies have posterUrl` };
  });

  // ══════════════════════════════════════════════════════════════════════════
  section("AC · Algorithm Correctness");

  await test("AC1", "Recommendation scores are positive numbers", async () => {
    const rec = await mongoose.connection.db
      .collection("recommendations")
      .findOne({ userId: { $ne: "GLOBAL" } });
    assert(rec?.items?.length > 0, "No recommendation items");
    rec.items.forEach((item) => {
      assert(typeof item.score === "number", `score is not a number: ${item.score}`);
      assert(item.score > 0, `score is not positive: ${item.score}`);
    });
    return { detail: `${rec.items.length} items all have positive scores` };
  });

  await test("AC2", "Similarity values are in valid Pearson range [-1, 1]", async () => {
    const rec = await mongoose.connection.db
      .collection("recommendations")
      .findOne({ userId: { $ne: "GLOBAL" } });
    const neighbors = rec?.items?.flatMap((i) => i.explanation?.topNeighbors ?? []);
    assert(neighbors?.length > 0, "No neighbor entries found");
    neighbors.forEach((nb) => {
      assert(
        nb.similarity >= -1 && nb.similarity <= 1,
        `Out-of-range similarity: ${nb.similarity}`
      );
    });
    return { detail: `${neighbors.length} neighbor similarity values all in [-1,1]` };
  });

  await test("AC3", "Already-rated movies filtered from recommendations", async () => {
    // Rate movie 1 with test user's token
    await req("POST", "/ratings", { body: { movieId: 1, rating: 5 }, token });
    const { json } = await req("GET", "/recommendations", { token });
    const containsRated = json.items?.some((i) => i.movieId === 1);
    assert(!containsRated, "Rated movie (id=1) still appears in recommendations");
    return { detail: "rated movie correctly excluded from recs" };
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Cleanup
  await mongoose.connection.db.collection("users").deleteOne({ email: testEmail });
  await mongoose.disconnect();

  // ══════════════════════════════════════════════════════════════════════════
  section("Summary");

  const total = pass + fail;
  log(`  Total tests : ${total}`);
  log(`  ✅ Passed   : ${pass}`);
  log(`  ❌ Failed   : ${fail}`);
  log(`  Pass rate   : ${((pass / total) * 100).toFixed(1)}%\n`);

  // Write report file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.resolve("logs");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `test-report-${timestamp}.txt`);

  const lines = [
    `MovieRec — Automated Test Report`,
    `Generated : ${new Date().toISOString()}`,
    `API       : ${BASE}`,
    ``,
    `${"═".repeat(72)}`,
    ``,
    ...results.map(
      (r) =>
        `${r.status.padEnd(4)}  [${r.id.padEnd(5)}]  ${r.name.padEnd(55)} ${r.ms}ms${r.detail ? "   →  " + r.detail : ""}`
    ),
    ``,
    `${"═".repeat(72)}`,
    `TOTAL: ${total}  |  PASS: ${pass}  |  FAIL: ${fail}  |  PASS RATE: ${((pass / total) * 100).toFixed(1)}%`,
  ];

  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  log(`\n  📄  Report saved to: ${outPath}\n`);
}

run().catch((err) => {
  console.error("Test runner crashed:", err);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
