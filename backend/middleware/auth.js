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
// IMPORTANT: every route in this app queries Mongo with
// `new ObjectId(req.userId)`. Auth0's user identifier (the "sub" claim,
// e.g. "auth0|abc123") is NOT a valid Mongo ObjectId, so we never expose
// it to route handlers directly. Instead, on a successful Auth0 login we
// look up (or just-in-time create) a real Mongo user document for that
// Auth0 identity, then set req.userId to THAT document's real ObjectId.
// Every existing route works unchanged, with zero knowledge that Auth0
// exists at all.

const jwt = require("jsonwebtoken");
const { auth } = require("express-oauth2-jwt-bearer");
const { getDB } = require("../db");

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
// header/payload segment (not the signature) just to read which issuer
// signed it, so we know which verification path to use. This is NOT a
// security check on its own — it only decides which validator runs; the
// validator does the actual cryptographic verification afterward.
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

// Finds the Mongo user document for a given Auth0 identity, creating one
// on first login if it doesn't exist yet ("just-in-time provisioning").
//
// Hot path (returning user): a single indexed findOne — fast, no extra
// network calls. Cold path (brand new user): one call to Auth0's
// /userinfo endpoint to seed name/email so Settings isn't blank on first
// login, then an atomic upsert so two near-simultaneous first requests
// can't create duplicate accounts for the same person.
async function provisionAuth0User(db, sub, accessToken) {
  const users = db.collection("users");

  const existing = await users.findOne({ auth0Id: sub });
  if (existing) return existing;

  let profile = { email: "", firstName: "", lastName: "", emailVerified: true };
  try {
    const resp = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (resp.ok) {
      const info = await resp.json();
      profile.email = info.email || "";
      profile.firstName = info.given_name || (info.name ? info.name.split(" ")[0] : "");
      profile.lastName = info.family_name || (info.name ? info.name.split(" ").slice(1).join(" ") : "");
      if (typeof info.email_verified === "boolean") profile.emailVerified = info.email_verified;
    }
  } catch {
    // Auth0's /userinfo call failed — proceed with blank profile fields.
    // The user can fill in their name via Settings; this never blocks login.
  }

  const user = await users.findOneAndUpdate(
    { auth0Id: sub },
    {
      $setOnInsert: {
        auth0Id: sub,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        passwordHash: null,       // Auth0 owns credentials for this account
        isVerified: profile.emailVerified,
        verificationToken: null,
        resetToken: null,
        resetTokenExpires: null,
        // Profile fields filled in later via onboarding, same as legacy signups.
        heightCm: null,
        weightKg: null,
        sex: null,
        activityLevel: null,
        goal: null,
        age: null,
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  return user;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  if (checkAuth0Jwt && looksLikeAuth0Token(token)) {
    return checkAuth0Jwt(req, res, async (err) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      try {
        const db = getDB();
        const sub = req.auth.payload.sub;
        const user = await provisionAuth0User(db, sub, token);
        req.userId = user._id.toString();
        req.authProvider = "auth0";
        return next();
      } catch (provisionErr) {
        console.error("Auth0 user provisioning error:", provisionErr);
        return res.status(500).json({ error: "Server error provisioning user account" });
      }
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
