import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

const app = express();

app.use(helmet());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// CLIENT_URL can be a single URL or comma-separated list of allowed origins.
// e.g. "https://your-app.vercel.app,http://localhost:5173"
const allowedOrigins = env.clientUrl
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Render health checks, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Return false (not an error) so Express sends a clean 403, not a 500
      return callback(null, false);
    },
    credentials: true
  })
);

// Root + health — used by Render's health checker
app.get("/", (req, res) => res.json({ name: "CyberSage API", status: "ok" }));
app.get("/api/health", (req, res) => res.json({ ok: true, environment: env.nodeEnv }));

app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/admin", adminRoutes);
app.use(notFound);
app.use(errorHandler);


export default app;
