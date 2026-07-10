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


// ---------- GET /api/foods/:id/micronutrients ----------
const MICRO_NUTRIENTS = [
  // ── Proximates ──
  { id: 1051, name: "Water", unit: "g", category: "Proximates" },
  { id: 1079, name: "Fiber, total dietary", unit: "g", category: "Proximates" },
  { id: 1082, name: "Fiber, soluble", unit: "g", category: "Proximates" },
  { id: 1063, name: "Sugars, total", unit: "g", category: "Proximates" },
  { id: 1235, name: "Added sugars", unit: "g", category: "Proximates" },
  { id: 1057, name: "Caffeine", unit: "mg", category: "Proximates" },
  { id: 1058, name: "Theobromine", unit: "mg", category: "Proximates" },
  { id: 1009, name: "Starch", unit: "g", category: "Proximates" },

  // ── Fats ──
  { id: 1258, name: "Fatty acids, saturated", unit: "g", category: "Fats" },
  { id: 1292, name: "Fatty acids, monounsaturated", unit: "g", category: "Fats" },
  { id: 1293, name: "Fatty acids, polyunsaturated", unit: "g", category: "Fats" },
  { id: 1257, name: "Fatty acids, trans", unit: "g", category: "Fats" },
  { id: 1253, name: "Cholesterol", unit: "mg", category: "Fats" },
  { id: 1278, name: "Omega-3 (ALA)", unit: "g", category: "Fats" },
  { id: 1404, name: "Omega-3 (EPA)", unit: "g", category: "Fats" },
  { id: 1405, name: "Omega-3 (DHA)", unit: "g", category: "Fats" },

  // ── Minerals ──
  { id: 1087, name: "Calcium", unit: "mg", category: "Minerals" },
  { id: 1089, name: "Iron", unit: "mg", category: "Minerals" },
  { id: 1090, name: "Magnesium", unit: "mg", category: "Minerals" },
  { id: 1091, name: "Phosphorus", unit: "mg", category: "Minerals" },
  { id: 1092, name: "Potassium", unit: "mg", category: "Minerals" },
  { id: 1093, name: "Sodium", unit: "mg", category: "Minerals" },
  { id: 1095, name: "Zinc", unit: "mg", category: "Minerals" },
  { id: 1098, name: "Copper", unit: "mg", category: "Minerals" },
  { id: 1101, name: "Manganese", unit: "mg", category: "Minerals" },
  { id: 1103, name: "Selenium", unit: "µg", category: "Minerals" },
  { id: 1099, name: "Fluoride", unit: "µg", category: "Minerals" },
  { id: 1096, name: "Chromium", unit: "µg", category: "Minerals" },
  { id: 1100, name: "Molybdenum", unit: "µg", category: "Minerals" },
  { id: 1094, name: "Sulfur", unit: "mg", category: "Minerals" },

  // ── Vitamins ──
  { id: 1106, name: "Vitamin A", unit: "µg", category: "Vitamins" },
  { id: 1107, name: "Beta-carotene", unit: "µg", category: "Vitamins" },
  { id: 1109, name: "Vitamin E", unit: "mg", category: "Vitamins" },
  { id: 1110, name: "Vitamin D (D2+D3)", unit: "µg", category: "Vitamins" },
  { id: 1114, name: "Vitamin D3", unit: "µg", category: "Vitamins" },
  { id: 1185, name: "Vitamin K", unit: "µg", category: "Vitamins" },
  { id: 1162, name: "Vitamin C", unit: "mg", category: "Vitamins" },
  { id: 1165, name: "Thiamin (B1)", unit: "mg", category: "Vitamins" },
  { id: 1166, name: "Riboflavin (B2)", unit: "mg", category: "Vitamins" },
  { id: 1167, name: "Niacin (B3)", unit: "mg", category: "Vitamins" },
  { id: 1170, name: "Pantothenic acid (B5)", unit: "mg", category: "Vitamins" },
  { id: 1175, name: "Vitamin B6", unit: "mg", category: "Vitamins" },
  { id: 1177, name: "Folate, total", unit: "µg", category: "Vitamins" },
  { id: 1190, name: "Folic acid", unit: "µg", category: "Vitamins" },
  { id: 1178, name: "Vitamin B12", unit: "µg", category: "Vitamins" },
  { id: 1180, name: "Choline", unit: "mg", category: "Vitamins" },
  { id: 1184, name: "Betaine", unit: "mg", category: "Vitamins" },

  // ── Amino Acids ──
  { id: 1210, name: "Tryptophan", unit: "g", category: "Amino Acids" },
  { id: 1211, name: "Threonine", unit: "g", category: "Amino Acids" },
  { id: 1212, name: "Isoleucine", unit: "g", category: "Amino Acids" },
  { id: 1213, name: "Leucine", unit: "g", category: "Amino Acids" },
  { id: 1214, name: "Lysine", unit: "g", category: "Amino Acids" },
  { id: 1215, name: "Methionine", unit: "g", category: "Amino Acids" },
  { id: 1216, name: "Cystine", unit: "g", category: "Amino Acids" },
  { id: 1217, name: "Phenylalanine", unit: "g", category: "Amino Acids" },
  { id: 1218, name: "Tyrosine", unit: "g", category: "Amino Acids" },
  { id: 1219, name: "Valine", unit: "g", category: "Amino Acids" },
  { id: 1220, name: "Arginine", unit: "g", category: "Amino Acids" },
  { id: 1221, name: "Histidine", unit: "g", category: "Amino Acids" },
  { id: 1222, name: "Alanine", unit: "g", category: "Amino Acids" },
  { id: 1223, name: "Aspartic acid", unit: "g", category: "Amino Acids" },
  { id: 1224, name: "Glutamic acid", unit: "g", category: "Amino Acids" },
  { id: 1225, name: "Glycine", unit: "g", category: "Amino Acids" },
  { id: 1226, name: "Proline", unit: "g", category: "Amino Acids" },
  { id: 1227, name: "Serine", unit: "g", category: "Amino Acids" },
];

router.get("/foods/:id/micronutrients", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid food id" });
    }

    const db = getDB();
    const foods = db.collection("foods");

    // Get the food from MongoDB to get its fdcId
    const food = await foods.findOne({ _id: new ObjectId(id) });
    if (!food) {
      return res.status(404).json({ error: "Food not found" });
    }

    let fdcNutrients = [];

    // If it's an FDC food, fetch full detail directly from FDC for the most complete data
    if (food.source === "fdc" && food.fdcId && process.env.FDC_API_KEY) {
      try {
        const url = `https://api.nal.usda.gov/fdc/v1/food/${food.fdcId}?api_key=${process.env.FDC_API_KEY}`;
        const response = await fetch(url);
        if (response.ok) {
          const fdcData = await response.json();
          fdcNutrients = fdcData.foodNutrients || [];
        }
      } catch {
        // FDC unreachable — fall through to empty nutrients
      }
    }

    // Build a lookup map from nutrient id → amount
    const nutrientMap = {};
    for (const n of fdcNutrients) {
      const nid = n.nutrient?.id ?? n.nutrientId;
      const amount = n.amount ?? n.value ?? 0;
      if (nid && amount > 0) {
        nutrientMap[nid] = amount;
      }
    }

    // Group by category, only include nutrients that have a non-zero value
    const grouped = {};
    for (const nutrient of MICRO_NUTRIENTS) {
      const amount = nutrientMap[nutrient.id];
      if (amount && amount > 0) {
        if (!grouped[nutrient.category]) {
          grouped[nutrient.category] = [];
        }
        grouped[nutrient.category].push({
          name: nutrient.name,
          amount: Math.round(amount * 1000) / 1000, // 3 decimal places max
          unit: nutrient.unit,
        });
      }
    }

    return res.status(200).json({
      foodId: id,
      foodName: food.name,
      servingSize: food.servingSize,
      servingSizeUnit: food.servingSizeUnit,
      source: food.source,
      micronutrients: grouped,
    });
  } catch (err) {
    console.error("Micronutrients error:", err);
    return res.status(500).json({ error: "Server error fetching micronutrients" });
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