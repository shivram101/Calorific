// routes/logs.js
// Endpoints: POST /api/logs, GET /api/logs?date=, PUT /api/logs/:id, DELETE /api/logs/:id,
//            POST /api/water, GET /api/water?date=
//
// Date convention: dates are stored/queried as "YYYY-MM-DD" strings (not full
// Date objects) so "get everything logged today" is a simple equality match
// rather than a timezone-sensitive range query. The frontend is responsible
// for sending the user's local calendar date in that format.

const express = require("express");
const { ObjectId } = require("mongodb");

const { getDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const VALID_MEALS = ["breakfast", "lunch", "dinner", "snack"];

function isValidDateString(str) {
  return typeof str === "string" && /^\d{4}-\d{2}-\d{2}$/.test(str);
}

// ---------- POST /api/logs ----------
// Body: { foodId, quantity, meal, date }
// `quantity` is a multiplier on the food's stored servingSize (e.g. 1.5 servings)
router.post("/logs", requireAuth, async (req, res) => {
  try {
    const { foodId, quantity, meal, date } = req.body;

    if (!foodId || !ObjectId.isValid(foodId)) {
      return res.status(400).json({ error: "Valid foodId is required" });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "quantity must be a positive number" });
    }
    if (!VALID_MEALS.includes(meal)) {
      return res.status(400).json({ error: `meal must be one of: ${VALID_MEALS.join(", ")}` });
    }
    if (!isValidDateString(date)) {
      return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });
    }

    const db = getDB();
    const foods = db.collection("foods");
    const logs = db.collection("logs");

    const food = await foods.findOne({ _id: new ObjectId(foodId) });
    if (!food) {
      return res.status(404).json({ error: "Food not found" });
    }

    const logEntry = {
      userId: req.userId,
      foodId: new ObjectId(foodId),
      foodName: food.name, // denormalized snapshot so the diary doesn't need a join to display
      quantity: Number(quantity),
      meal,
      date,
      // Snapshot the per-serving macros at log time multiplied by quantity,
      // so editing a food later doesn't silently rewrite past diary entries.
      calories: food.calories * Number(quantity),
      protein: food.protein * Number(quantity),
      fat: food.fat * Number(quantity),
      carbs: food.carbs * Number(quantity),
      createdAt: new Date(),
    };

    const result = await logs.insertOne(logEntry);

    return res.status(201).json({ ...logEntry, _id: result.insertedId });
  } catch (err) {
    console.error("Create log error:", err);
    return res.status(500).json({ error: "Server error creating log entry" });
  }
});

// ---------- GET /api/logs?date= ----------
router.get("/logs", requireAuth, async (req, res) => {
  try {
    const { date } = req.query;

    if (!isValidDateString(date)) {
      return res.status(400).json({ error: "date query param must be in YYYY-MM-DD format" });
    }

    const db = getDB();
    const logs = db.collection("logs");

    const entries = await logs
      .find({ userId: req.userId, date })
      .sort({ createdAt: 1 })
      .toArray();

    const totals = entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        fat: acc.fat + entry.fat,
        carbs: acc.carbs + entry.carbs,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    return res.status(200).json({ date, entries, totals });
  } catch (err) {
    console.error("Get logs error:", err);
    return res.status(500).json({ error: "Server error fetching logs" });
  }
});

// ---------- PUT /api/logs/:id ----------
// Body may include: quantity, meal
router.put("/logs/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, meal } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid log id" });
    }

    const db = getDB();
    const logs = db.collection("logs");
    const foods = db.collection("foods");

    const existing = await logs.findOne({ _id: new ObjectId(id), userId: req.userId });
    if (!existing) {
      return res.status(404).json({ error: "Log entry not found" });
    }

    const updates = {};

    if (meal !== undefined) {
      if (!VALID_MEALS.includes(meal)) {
        return res.status(400).json({ error: `meal must be one of: ${VALID_MEALS.join(", ")}` });
      }
      updates.meal = meal;
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        return res.status(400).json({ error: "quantity must be a positive number" });
      }
      // Re-derive macro snapshot from the food's current per-serving values
      const food = await foods.findOne({ _id: existing.foodId });
      updates.quantity = Number(quantity);
      updates.calories = food.calories * Number(quantity);
      updates.protein = food.protein * Number(quantity);
      updates.fat = food.fat * Number(quantity);
      updates.carbs = food.carbs * Number(quantity);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await logs.updateOne({ _id: existing._id }, { $set: updates });

    return res.status(200).json({ message: "Log entry updated", updates });
  } catch (err) {
    console.error("Update log error:", err);
    return res.status(500).json({ error: "Server error updating log entry" });
  }
});

// ---------- DELETE /api/logs/:id ----------
router.delete("/logs/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid log id" });
    }

    const db = getDB();
    const logs = db.collection("logs");

    const result = await logs.deleteOne({ _id: new ObjectId(id), userId: req.userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Log entry not found" });
    }

    return res.status(200).json({ message: "Log entry deleted" });
  } catch (err) {
    console.error("Delete log error:", err);
    return res.status(500).json({ error: "Server error deleting log entry" });
  }
});

// ---------- POST /api/water ----------
// Body: { amountMl, date }
router.post("/water", requireAuth, async (req, res) => {
  try {
    const { amountMl, date } = req.body;

    if (!amountMl || amountMl <= 0) {
      return res.status(400).json({ error: "amountMl must be a positive number" });
    }
    if (!isValidDateString(date)) {
      return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });
    }

    const db = getDB();
    const waterLogs = db.collection("waterLogs");

    const entry = {
      userId: req.userId,
      amountMl: Number(amountMl),
      date,
      createdAt: new Date(),
    };

    const result = await waterLogs.insertOne(entry);

    return res.status(201).json({ ...entry, _id: result.insertedId });
  } catch (err) {
    console.error("Create water log error:", err);
    return res.status(500).json({ error: "Server error logging water" });
  }
});

// ---------- GET /api/water?date= ----------
router.get("/water", requireAuth, async (req, res) => {
  try {
    const { date } = req.query;
    if (!isValidDateString(date)) {
      return res.status(400).json({ error: "date query param must be in YYYY-MM-DD format" });
    }

    const db = getDB();
    const waterLogs = db.collection("waterLogs");

    const entries = await waterLogs.find({ userId: req.userId, date }).toArray();
    const totalMl = entries.reduce((sum, e) => sum + e.amountMl, 0);

    return res.status(200).json({ date, entries, totalMl });
  } catch (err) {
    console.error("Get water log error:", err);
    return res.status(500).json({ error: "Server error fetching water log" });
  }
});

// ---------- DELETE /api/water/:id ----------
// The frontend's water-entry ✕ buttons call this (deleteWater in client.ts).
router.delete("/water/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid water entry id" });
    }

    const db = getDB();
    const result = await db.collection("waterLogs").deleteOne({
      _id: new ObjectId(id),
      userId: req.userId, // users can only delete their own entries
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Water entry not found" });
    }

    return res.status(200).json({ message: "Water entry deleted" });
  } catch (err) {
    console.error("Delete water error:", err);
    return res.status(500).json({ error: "Server error deleting water entry" });
  }
});

module.exports = router;
