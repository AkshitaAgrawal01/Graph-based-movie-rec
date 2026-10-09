import jwt from "jsonwebtoken";

// Protects a route: only lets the request through if it carries a valid token.
// On success, attaches the user's id to req.userId for the route to use.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization; // expected format: "Bearer <token>"

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not signed in." });
  }

  const token = header.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next(); // token is valid, let the route handler run
  } catch {
    res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
  }
}