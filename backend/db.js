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
  db = client.db("CALORIFIC_DB");
  console.log("Connected to MongoDB (calorific database)");
  return db;
}

function getDB() {
  if (!db) {
    throw new Error("Database not initialized - call connectDB() before getDB()");
  }
  return db;
}

module.exports = { connectDB, getDB };
