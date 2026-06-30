// routes/targets.js
// Endpoints: GET /api/targets, PUT /api/targets,
//            GET /api/progress/weight?range=, POST /api/progress/weight,
//            GET /api/progress/summary?range=
//
// `range` query params accept a number of days (e.g. range=30) and default
// to 30 if omitted. Dates follow the same "YYYY-MM-DD" string convention
// used in routes/logs.js.

const express = require("express");
const { getDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function todayDateString() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function dateStringDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function parseRange(rangeParam, fallbackDays = 30) {
  const days = parseInt(rangeParam, 10);
  return Number.isFinite(days) && days > 0 ? days : fallbackDays;
}

// ---------- GET /api/targets ----------
router.get("/targets", requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const targets = db.collection("targets");

    const userTargets = await targets.findOne({ userId: req.userId });

    if (!userTargets) {
      // No targets set yet isn't an error - the frontend's Targets/Goals
      // page (Section 2.1) should treat null as "needs setup", not a failure.
      return res.status(200).json(null);
    }

    return res.status(200).json(userTargets);
  } catch (err) {
    console.error("Get targets error:", err);
    return res.status(500).json({ error: "Server error fetching targets" });
  }
});

// ---------- PUT /api/targets ----------
// Body: { calorieTarget, proteinTarget, carbTarget, fatTarget }
// Upserts - first call creates the document, later calls update it.
router.put("/targets", requireAuth, async (req, res) => {
  try {
    const { calorieTarget, proteinTarget, carbTarget, fatTarget } = req.body;

    if (
      calorieTarget === undefined ||
      proteinTarget === undefined ||
      carbTarget === undefined ||
      fatTarget === undefined
    ) {
      return res.status(400).json({
        error: "calorieTarget, proteinTarget, carbTarget, and fatTarget are all required",
      });
    }

    const values = { calorieTarget, proteinTarget, carbTarget, fatTarget };
    for (const [key, value] of Object.entries(values)) {
      if (typeof value !== "number" || value < 0) {
        return res.status(400).json({ error: `${key} must be a non-negative number` });
      }
    }

    const db = getDB();
    const targets = db.collection("targets");

    await targets.updateOne(
      { userId: req.userId },
      {
        $set: {
          userId: req.userId,
          calorieTarget,
          proteinTarget,
          carbTarget,
          fatTarget,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const updated = await targets.findOne({ userId: req.userId });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Update targets error:", err);
    return res.status(500).json({ error: "Server error updating targets" });
  }
});

// ---------- POST /api/progress/weight ----------
// Body: { weightKg, date }  (date optional, defaults to today)
router.post("/progress/weight", requireAuth, async (req, res) => {
  try {
    const { weightKg, date } = req.body;

    if (!weightKg || weightKg <= 0) {
      return res.status(400).json({ error: "weightKg must be a positive number" });
    }

    const entryDate = date || todayDateString();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
      return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });
    }

    const db = getDB();
    const weightEntries = db.collection("weightEntries");

    // One entry per user per day - upsert so logging weight twice in a day
    // updates that day's entry instead of creating duplicates that would
    // skew the trend chart.
    await weightEntries.updateOne(
      { userId: req.userId, date: entryDate },
      { $set: { userId: req.userId, date: entryDate, weightKg: Number(weightKg), createdAt: new Date() } },
      { upsert: true }
    );

    const saved = await weightEntries.findOne({ userId: req.userId, date: entryDate });

    return res.status(201).json(saved);
  } catch (err) {
    console.error("Log weight error:", err);
    return res.status(500).json({ error: "Server error logging weight" });
  }
});

// ---------- GET /api/progress/weight?range= ----------
router.get("/progress/weight", requireAuth, async (req, res) => {
  try {
    const days = parseRange(req.query.range, 30);
    const startDate = dateStringDaysAgo(days);

    const db = getDB();
    const weightEntries = db.collection("weightEntries");

    const entries = await weightEntries
      .find({ userId: req.userId, date: { $gte: startDate } })
      .sort({ date: 1 })
      .toArray();

    return res.status(200).json({ range: days, entries });
  } catch (err) {
    console.error("Get weight history error:", err);
    return res.status(500).json({ error: "Server error fetching weight history" });
  }
});

// ---------- GET /api/progress/summary?range= ----------
// Aggregated daily totals (calories/protein/fat/carbs) over the date range,
// for the Progress/Trends page's adherence chart (Section 2.1).
router.get("/progress/summary", requireAuth, async (req, res) => {
  try {
    const days = parseRange(req.query.range, 30);
    const startDate = dateStringDaysAgo(days);

    const db = getDB();
    const logs = db.collection("logs");

    // Group log entries by date and sum macros - one summary row per day
    // rather than per meal/entry, which is what a trend chart needs.
    const summary = await logs
      .aggregate([
        { $match: { userId: req.userId, date: { $gte: startDate } } },
        {
          $group: {
            _id: "$date",
            calories: { $sum: "$calories" },
            protein: { $sum: "$protein" },
            fat: { $sum: "$fat" },
            carbs: { $sum: "$carbs" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            calories: 1,
            protein: 1,
            fat: 1,
            carbs: 1,
          },
        },
      ])
      .toArray();

    return res.status(200).json({ range: days, summary });
  } catch (err) {
    console.error("Get progress summary error:", err);
    return res.status(500).json({ error: "Server error fetching progress summary" });
  }
});

module.exports = router;
