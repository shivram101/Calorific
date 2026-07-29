// db.js
// Single shared MongoDB connection using the raw `mongodb` driver.
// No Mongoose / ODM, per course requirements - every route gets
// collections from here and writes queries by hand.

const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI is not set. Copy .env.example to .env and fill it in.");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function connectDB() {
  if (db) return db;
  await client.connect();
  db = client.db("Calorific_DB");
  console.log("Connected to MongoDB (calorific database)");

  // Speeds up the Auth0 just-in-time provisioning lookup in
  // middleware/auth.js, and prevents two near-simultaneous first
  // requests from ever creating duplicate accounts for the same
  // Auth0 identity. Sparse because legacy (pre-Auth0) users have no
  // auth0Id field at all, and this index should ignore them entirely.
  try {
    await db.collection("users").createIndex(
      { auth0Id: 1 },
      { unique: true, sparse: true, name: "auth0Id_unique" }
    );
  } catch (err) {
    // Index creation failing shouldn't take the whole API down - the app
    // still works without it, just slower on Auth0 user lookups.
    console.error("Failed to create auth0Id index (continuing anyway):", err.message);
  }

  return db;
}

function getDB() {
  if (!db) {
    throw new Error("Database not initialized - call connectDB() before getDB()");
  }
  return db;
}

module.exports = { connectDB, getDB };
