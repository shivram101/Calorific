// routes/profile.js
// Endpoints: GET /api/profile, PUT /api/profile, DELETE /api/account
// All require a valid JWT (requireAuth middleware sets req.userId)

const express = require("express");
const { ObjectId } = require("mongodb");

const { getDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ---------- GET /api/profile ----------
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { passwordHash: 0, verificationToken: 0, resetToken: 0, resetTokenExpires: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ error: "Server error fetching profile" });
  }
});

// ---------- PUT /api/profile ----------
// Body may include any subset of: firstName, lastName, heightCm, weightKg, sex, activityLevel, goal
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const allowedFields = [
  "firstName", "lastName", "heightCm", "weightKg", "sex", "activityLevel", "goal", "age",
  ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid profile fields provided" });
    }

    const db = getDB();
    const users = db.collection("users");

    await users.updateOne({ _id: new ObjectId(req.userId) }, { $set: updates });

    return res.status(200).json({ message: "Profile updated", updates });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ error: "Server error updating profile" });
  }
});

// ---------- DELETE /api/account ----------
router.delete("/account", requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const userId = new ObjectId(req.userId);

    // Clean up related collections too, so deleting an account doesn't
    // leave orphaned logs/targets/weight entries behind.
    await Promise.all([
      db.collection("users").deleteOne({ _id: userId }),
      db.collection("logs").deleteMany({ userId: req.userId }),
      db.collection("waterLogs").deleteMany({ userId: req.userId }),
      db.collection("targets").deleteMany({ userId: req.userId }),
      db.collection("weightEntries").deleteMany({ userId: req.userId }),
    ]);

    return res.status(200).json({ message: "Account and associated data deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    return res.status(500).json({ error: "Server error deleting account" });
  }
});

module.exports = router;
