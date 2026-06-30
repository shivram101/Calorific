// routes/foods.js
// Endpoints: GET /api/foods/search, GET /api/foods/:id, POST /api/foods/custom
//
// Search strategy (per team decision): hit FDC live, cache each normalized
// result into the local `foods` collection (upsert on fdcId) so repeat
// searches/detail-lookups for common foods don't re-hit the external API
// and don't eat into FDC's 1,000 req/hour rate limit.

const express = require("express");
const { ObjectId } = require("mongodb");

const { getDB } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { searchFDC, getFDCFoodDetail } = require("../fdcService");

const router = express.Router();

// ---------- GET /api/foods/search?q= ----------
router.get("/foods/search", requireAuth, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const db = getDB();
    const foods = db.collection("foods");

    // Always search FDC live so results stay fresh and broad.
    const results = await searchFDC(query.trim());

    // Cache each result: upsert by fdcId so repeat searches don't duplicate entries.
    const cacheOps = results.map((food) => ({
      updateOne: {
        filter: { source: "fdc", fdcId: food.fdcId },
        update: { $set: food },
        upsert: true,
      },
    }));

    if (cacheOps.length > 0) {
      await foods.bulkWrite(cacheOps);
    }

    // Re-read from the DB so every result has a Mongo _id the frontend can use
    // consistently with custom foods (which only ever exist in Mongo).
    const fdcIds = results.map((f) => f.fdcId);
    const cachedResults = await foods
      .find({ source: "fdc", fdcId: { $in: fdcIds } })
      .toArray();

    return res.status(200).json(cachedResults);
  } catch (err) {
    console.error("Food search error:", err);
    return res.status(500).json({ error: "Server error searching foods" });
  }
});

// ---------- GET /api/foods/:id ----------
// :id is a Mongo _id (works for both cached FDC foods and custom foods)
router.get("/foods/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid food id" });
    }

    const db = getDB();
    const foods = db.collection("foods");

    let food = await foods.findOne({ _id: new ObjectId(id) });

    if (!food) {
      return res.status(404).json({ error: "Food not found" });
    }

    // Cache hit but stale FDC data is unlikely for a class project's timeline,
    // so we serve straight from cache here. If a fresher pull is ever needed,
    // getFDCFoodDetail(food.fdcId) can be called explicitly.
    return res.status(200).json(food);
  } catch (err) {
    console.error("Food detail error:", err);
    return res.status(500).json({ error: "Server error fetching food detail" });
  }
});

// ---------- POST /api/foods/custom ----------
router.post("/foods/custom", requireAuth, async (req, res) => {
  try {
    const { name, servingSize, servingSizeUnit, calories, protein, fat, carbs } = req.body;

    if (!name || calories === undefined) {
      return res.status(400).json({ error: "name and calories are required" });
    }

    const db = getDB();
    const foods = db.collection("foods");

    const customFood = {
      source: "user-submitted",
      createdBy: req.userId,
      name,
      brand: null,
      servingSize: servingSize || 1,
      servingSizeUnit: servingSizeUnit || "serving",
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      fat: Number(fat) || 0,
      carbs: Number(carbs) || 0,
      createdAt: new Date(),
    };

    const result = await foods.insertOne(customFood);

    return res.status(201).json({ ...customFood, _id: result.insertedId });
  } catch (err) {
    console.error("Custom food creation error:", err);
    return res.status(500).json({ error: "Server error creating custom food" });
  }
});

module.exports = router;
