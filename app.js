/**
 * Vendor SaaS Licensing Engine - Express Application Configuration
 * Features CORS restriction for Client Apps, JSON Body Parsing, and Licensing Endpoints
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const licenseController = require("./controllers/licenseController");
const authController = require("./controllers/authController");

const app = express();

// 1. Client App Origin Configuration
const allowedOrigins = [
  "http://localhost:5173", // Vite default client dev server
  "http://localhost:3000", // Next.js / React client app
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://localhost:5174",
  "http://localhost:8080",
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/+$/, ""));
}
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(",").forEach((origin) => {
    const trimmed = origin.trim().replace(/\/+$/, "");
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

// 2. CORS Middleware Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, server-to-server or postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
      return callback(null, true);
    } else {
      const msg = `CORS policy: The origin ${origin} is not authorized to access this Vendor API.`;
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-License-Key",
    "X-App-Key",
    "X-Client-Id",
    "X-Forwarded-For",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Length", "X-License-Status"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// 3. Body Parsing Middlewares
// Ensures JSON body payloads (such as heartbeat telemetry) are fully parsed
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Request Logging (Telemetry)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.includes("heartbeat") || req.path.includes("verify") || res.statusCode >= 400) {
      console.log(`[Express API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// 5. Health Check & Diagnostics
app.get(["/", "/health", "/api/health"], (req, res) => {
  res.json({
    success: true,
    service: "Vendor SaaS Central Licensing & Heartbeat Controller",
    status: "HEALTHY",
    timestamp: new Date().toISOString(),
    allowedOrigins,
    corsEnabled: true,
    jsonParserEnabled: true,
  });
});

// 6. Core Licensing & Heartbeat Routes
// POST /api/license/heartbeat - Updates last_sync timestamp & live_status
app.post(["/api/license/heartbeat", "/heartbeat", "/api/heartbeat"], (req, res) => {
  return licenseController.heartbeat(req, res);
});

// POST /api/license/verify - Full verification with killswitch directives
app.post(["/api/license/verify", "/verify", "/api/verify"], (req, res) => {
  return licenseController.verify(req, res);
});

// POST /api/license/generate - Issues unique license keys
app.post(["/api/license/generate", "/generate"], (req, res) => {
  return licenseController.generate(req, res);
});

// POST /api/license/update-status - Instant killswitch / block / restore
app.post(["/api/license/update-status", "/update-status"], (req, res) => {
  return licenseController.updateStatus(req, res);
});

// GET /api/license - Lists all licenses
app.get(["/api/license", "/api/licenses"], (req, res) => {
  return licenseController.listLicenses(req, res);
});

// 7. Global 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.method} ${req.originalUrl} not found on Vendor Express server.`,
  });
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Express Server Error:", err.message);
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      error: "CORS Error: Unauthorized Origin",
      message: err.message,
    });
  }
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred",
  });
});

module.exports = app;
