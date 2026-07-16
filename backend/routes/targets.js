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

// ---------- Mifflin-St Jeor TDEE calculator ----------
function calculateSuggestedTargets(profile) {
  const { heightCm, weightKg, age, sex, activityLevel, goal } = profile;

  if (!heightCm || !weightKg || !age || !sex || !activityLevel || !goal) {
    return null; // incomplete biometrics, can't calculate
  }

  // Mifflin-St Jeor BMR
  const bmr =
    sex === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };

  const goalAdjustments = {
    lose: -500,
    maintain: 0,
    gain: 300,
  };

  const tdee = bmr * (activityMultipliers[activityLevel] ?? 1.2);
  const calorieTarget = Math.round(tdee + (goalAdjustments[goal] ?? 0));

  // Macro splits: 25% protein, 45% carbs, 30% fat
  const proteinTarget = Math.round((calorieTarget * 0.25) / 4); // 4 cal/g
  const carbTarget    = Math.round((calorieTarget * 0.45) / 4); // 4 cal/g
  const fatTarget     = Math.round((calorieTarget * 0.30) / 9); // 9 cal/g

  return { calorieTarget, proteinTarget, carbTarget, fatTarget };
}

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

// ---------- GET /api/targets/suggested ----------
// Returns auto-calculated targets derived from the user's biometrics and goal.
// The frontend calls this after the user picks a goal so it can preview the
// recommended values before the user confirms and saves via PUT /api/targets.
// MUST be defined before /targets or Express will never reach this route.
router.get("/targets/suggested", requireAuth, async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const db = getDB();

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { heightCm: 1, weightKg: 1, age: 1, sex: 1, activityLevel: 1, goal: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const suggested = calculateSuggestedTargets(user);

    if (!suggested) {
      return res.status(422).json({
        error: "Incomplete biometrics — please complete onboarding before requesting suggested targets",
        missing: ["heightCm", "weightKg", "age", "sex", "activityLevel", "goal"].filter(
          (f) => !user[f]
        ),
      });
    }

    return res.status(200).json(suggested);
  } catch (err) {
    console.error("Suggested targets error:", err);
    return res.status(500).json({ error: "Server error calculating suggested targets" });
  }
});

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