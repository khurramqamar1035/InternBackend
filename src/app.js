import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // allow Vercel to embed if needed
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  }
}));

// ── HTTP logging (stdout only — no sensitive body logged) ─────────────────────
app.use(morgan(env.nodeEnv === "production"
  ? ':remote-addr - :method :url :status :res[content-length] - :response-time ms'
  : "dev"
));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "50kb" })); // tight limit — no large payloads expected
app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(cookieParser());

// ── NoSQL injection sanitizer — strips keys starting with $ or containing . ───
app.use((req, _res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else {
        sanitize(obj[key]);
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = env.clientUrl
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // curl / Render health checks
      if (allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn("CORS blocked request", { origin });
      return callback(null, false);
    },
    credentials: true
  })
);

// ── Global rate limiter — loose fallback for all routes ───────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please slow down." }
});
app.use(globalLimiter);

// ── Health / root ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.json({ name: "CyberSage API", status: "ok" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, environment: env.nodeEnv }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/game",     gameRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/exam",     examRoutes);
app.use("/api/admin",    adminRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
