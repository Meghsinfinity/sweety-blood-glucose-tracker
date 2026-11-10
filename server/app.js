const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const readingRoutes = require("./routes/readingRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok", app: "Sweety API" }));
app.use("/api/auth", authRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/reports", reportRoutes);

app.use((req, res) => res.status(404).json({ message: "API endpoint not found." }));
app.use((error, req, res, next) => {
  console.error("Unhandled request error:", error);
  res.status(500).json({ message: "Unexpected server error." });
});
module.exports = app;
