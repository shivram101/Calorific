// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { connectDB } = require("./db");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const foodRoutes = require("./routes/foods");
const logRoutes = require("./routes/logs");
const targetRoutes = require("./routes/targets");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Route groups
app.use("/api", authRoutes);
app.use("/api", profileRoutes);
app.use("/api", foodRoutes);
app.use("/api", logRoutes);
app.use("/api", targetRoutes);

// 404 catch-all
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Calorific API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();