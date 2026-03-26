require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const purchasesRoutes = require("./routes/purchases");
const transfersRoutes = require("./routes/transfers");
const assignmentsRoutes = require("./routes/assignments");
const basesRoutes = require("./routes/bases");

// 🔴 Safety check for MongoDB ENV
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment variables");
  process.exit(1);
}

// ✅ Connect MongoDB
connectDB();

const app = express();

// ✅ Middleware
app.use(cors()); // allow all origins (safe for assignment / demo)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/purchases", purchasesRoutes);
app.use("/api/transfers", transfersRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/bases", basesRoutes);

// ✅ Health route (important for Render testing)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Military Asset Management API Running",
    time: new Date(),
  });
});

// ✅ Root route (optional but useful)
app.get("/", (req, res) => {
  res.send("Military Asset Management Backend Running");
});

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "production"}`);
});