// routes/auth.js
// Endpoints: POST /api/register, GET /api/verify-email/:token, POST /api/login,
//            POST /api/forgot-password, POST /api/reset-password/:token
//
// Uses the raw MongoDB driver only (no Mongoose), per course requirements.

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { ObjectId } = require("mongodb");

const { getDB } = require("../db");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../emailService");

const router = express.Router();

const SALT_ROUNDS = 10;
const JWT_EXPIRY = "7d";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// ---------- POST /api/register ----------
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const db = getDB();
    const users = db.collection("users");

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await users.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = {
      email: normalizedEmail,
      passwordHash,
      firstName: firstName || "",
      lastName: lastName || "",
      isVerified: false,
      verificationToken,
      resetToken: null,
      resetTokenExpires: null,
      // profile fields, filled in later via onboarding (Section 2 Onboarding page)
      heightCm: null,
      weightKg: null,
      sex: null,
      activityLevel: null,
      goal: null,
      age: null,
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    await sendVerificationEmail(normalizedEmail, verificationToken);

    return res.status(201).json({
      message: "Account created. Check your email to verify your account.",
      userId: result.insertedId,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error during registration" });
  }
});

// ---------- GET /api/verify-email/:token ----------
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ verificationToken: token });
        console.log("User found:", user ? user.email : "NOT FOUND"); // ADD THIS

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification link" });
    }

    await users.updateOne(
      { _id: user._id },
      { $set: { isVerified: true }, $unset: { verificationToken: "" } }
    );

    return res.status(200).json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.error("Verify email error:", err);
    return res.status(500).json({ error: "Server error during email verification" });
  }
});

// ---------- POST /api/login ----------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const db = getDB();
    const users = db.collection("users");

    const normalizedEmail = email.toLowerCase().trim();
    const user = await users.findOne({ email: normalizedEmail });

    if (!user) {
      // Same error as wrong password, so we don't reveal which emails exist
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: "Please verify your email before logging in" });
    }

    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error during login" });
  }
});

// ---------- POST /api/resend-verification ----------
// Generates a fresh token and re-sends the verification email.
// Always returns 200 so we don't reveal whether an email is registered.
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const db = getDB();
    const users = db.collection("users");
    const normalizedEmail = email.toLowerCase().trim();
    const user = await users.findOne({ email: normalizedEmail });

    if (user && !user.isVerified) {
      const verificationToken = crypto.randomBytes(32).toString("hex");
      await users.updateOne(
        { _id: user._id },
        { $set: { verificationToken } }
      );
      await sendVerificationEmail(normalizedEmail, verificationToken);
    }

    return res.status(200).json({
      message: "If that email exists and is unverified, a new link has been sent.",
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    return res.status(500).json({ error: "Server error resending verification email" });
  }
});

// ---------- POST /api/forgot-password ----------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const db = getDB();
    const users = db.collection("users");
    const normalizedEmail = email.toLowerCase().trim();

    const user = await users.findOne({ email: normalizedEmail });

    // Always return success, even if the email isn't found.
    // Prevents attackers from using this endpoint to discover registered emails.
    if (!user) {
      return res.status(200).json({
        message: "If an account exists for that email, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await users.updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpires } }
    );

    await sendPasswordResetEmail(normalizedEmail, resetToken);

    return res.status(200).json({
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Server error during password reset request" });
  }
});

// ---------- POST /api/reset-password/:token ----------
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await users.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash },
        $unset: { resetToken: "", resetTokenExpires: "" },
      }
    );

    return res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Server error during password reset" });
  }
});

module.exports = router;
