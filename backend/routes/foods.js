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

// ---------- GET /api/foods/barcode/:upc ----------
// Dedicated barcode/UPC lookup — more reliable than general search for packaged foods.
// Filters to Branded dataType only (branded foods are the ones with UPC codes)
// and requests only 1 result, then caches and returns it.
// MUST be defined before /foods/:id or Express will match "barcode" as an id.
router.get("/foods/barcode/:upc", requireAuth, async (req, res) => {
  try {
    const { upc } = req.params;
    if (!upc || upc.trim().length === 0) {
      return res.status(400).json({ error: "UPC is required" });
    }

    const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
    const FDC_API_KEY = process.env.FDC_API_KEY;

    if (!FDC_API_KEY) {
      return res.status(500).json({ error: "FDC_API_KEY is not configured" });
    }

    const url = `${FDC_BASE_URL}/foods/search?query=${encodeURIComponent(upc.trim())}&pageSize=1&dataType=Branded&api_key=${FDC_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({ error: "FDC API request failed" });
    }

    const data = await response.json();
    const fdcFoods = data.foods || [];

    if (fdcFoods.length === 0) {
      return res.status(404).json({ error: "No food found for this barcode" });
    }

    // Normalize using the same shape as searchFDC results
    const { searchFDC } = require("../fdcService");
    const NUTRIENT_IDS = { CALORIES: 1008, PROTEIN: 1003, FAT: 1004, CARBS: 1005 };

    function extractNutrient(foodNutrients, nutrientId) {
      if (!Array.isArray(foodNutrients)) return 0;
      const match = foodNutrients.find(
        (n) => n.nutrient?.id === nutrientId || n.nutrientId === nutrientId
      );
      return match ? (match.amount ?? match.value ?? 0) : 0;
    }

    const fdcFood = fdcFoods[0];
    const normalized = {
      source: "fdc",
      fdcId: fdcFood.fdcId,
      name: fdcFood.description,
      brand: fdcFood.brandOwner || fdcFood.brandName || null,
      servingSize: fdcFood.servingSize || 100,
      servingSizeUnit: fdcFood.servingSizeUnit || "g",
      calories: extractNutrient(fdcFood.foodNutrients, NUTRIENT_IDS.CALORIES),
      protein: extractNutrient(fdcFood.foodNutrients, NUTRIENT_IDS.PROTEIN),
      fat: extractNutrient(fdcFood.foodNutrients, NUTRIENT_IDS.FAT),
      carbs: extractNutrient(fdcFood.foodNutrients, NUTRIENT_IDS.CARBS),
      cachedAt: new Date(),
    };

    // Cache in MongoDB so repeat scans of the same barcode don't hit FDC again
    const db = getDB();
    const foods = db.collection("foods");
    await foods.updateOne(
      { source: "fdc", fdcId: normalized.fdcId },
      { $set: normalized },
      { upsert: true }
    );

    const saved = await foods.findOne({ source: "fdc", fdcId: normalized.fdcId });
    return res.status(200).json(saved);
  } catch (err) {
    console.error("Barcode lookup error:", err);
    return res.status(500).json({ error: "Server error during barcode lookup" });
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
