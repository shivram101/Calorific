// middleware/auth.js
// Protects routes by requiring a valid token in the Authorization header.
//
// Supports TWO token formats simultaneously during the web->Auth0 migration:
//   1. Auth0-issued JWTs (web frontend, after the Auth0 migration)
//   2. Legacy custom JWTs signed with JWT_SECRET (mobile app, unmigrated)
//
// This lets web move to Auth0 without breaking mobile, which still issues
// its own tokens via POST /api/login. Once mobile is migrated too, the
// legacy path can be removed.
//
// req.userId is set on success either way, so every existing route
// handler works unchanged regardless of which auth system issued the token.

const jwt = require("jsonwebtoken");
const { auth } = require("express-oauth2-jwt-bearer");

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;     // e.g. dev-vqru0yyw14evmlui.us.auth0.com
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE; // e.g. https://calorific-api.azurewebsites.net

// Auth0's own middleware, configured once and reused. It validates the
// token's signature against Auth0's public JWKS keys, checks it hasn't
// expired, and confirms the audience matches our API identifier.
const checkAuth0Jwt = AUTH0_DOMAIN && AUTH0_AUDIENCE
  ? auth({
      audience: AUTH0_AUDIENCE,
      issuerBaseURL: `https://${AUTH0_DOMAIN}`,
    })
  : null;

// A JWT is three base64url segments separated by dots. We peek at the
// header segment (not the signature) just to read which issuer signed it,
// so we know which verification path to use. This is NOT itself a security
// check — it only decides which validator runs; the validator does the
// actual cryptographic verification.
function looksLikeAuth0Token(token) {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return false;
    const payload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));
    return typeof payload.iss === "string" && payload.iss.includes("auth0.com");
  } catch {
    return false;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  // Route to Auth0 validation if this looks like an Auth0 token and Auth0
  // is actually configured on this server.
  if (checkAuth0Jwt && looksLikeAuth0Token(token)) {
    return checkAuth0Jwt(req, res, (err) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      // Auth0's middleware attaches the verified claims at req.auth.payload.
      // `sub` is Auth0's stable user identifier (e.g. "auth0|abc123" or
      // "google-oauth2|456"), used the same way req.userId always has been.
      req.userId = req.auth.payload.sub;
      req.authProvider = "auth0";
      return next();
    });
  }

  // Legacy path: our own JWT_SECRET-signed tokens, still issued by the
  // mobile app's POST /api/login until mobile is migrated to Auth0 too.
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.authProvider = "legacy";
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
