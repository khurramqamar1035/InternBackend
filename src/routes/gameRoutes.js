import express from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import {
  getScenarios,
  getScenarioBySlug,
  submitChallenge,
  useHint,
  getLeaderboard
} from "../controllers/gameController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";

const router = express.Router();

// Prevent answer brute-forcing — 10 submits per 10 minutes per IP
const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: "Too many submission attempts. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false
});

// Prevent hint abuse — 30 hints per 15 minutes per user
const hintLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: "Too many hint requests." },
  standardHeaders: true,
  legacyHeaders: false
});

const submitSchema = z.object({
  body: z.object({
    scenarioId: z.string().min(1).max(100),
    answers: z.array(z.any()).min(1).max(50), // cap array length
    hintsUsed: z.array(z.number().int().min(0).max(20)).max(20).optional(),
    timeSpent: z.number().min(0).max(7200).optional() // max 2 hours
  })
});

const hintSchema = z.object({
  body: z.object({
    scenarioId: z.string().min(1).max(100),
    hintIndex: z.number().int().min(0).max(20)
  })
});

router.get("/scenarios",        protect, getScenarios);
router.get("/scenarios/:slug",  protect, getScenarioBySlug);
router.post("/submit",          protect, submitLimiter, validate(submitSchema), submitChallenge);
router.post("/hint",            protect, hintLimiter,   validate(hintSchema),   useHint);
router.get("/leaderboard",      protect, getLeaderboard);

export default router;
