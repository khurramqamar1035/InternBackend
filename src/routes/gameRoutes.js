import express from "express";
import { z } from "zod";
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

const submitSchema = z.object({
  body: z.object({
    scenarioId: z.string().min(1),
    answers: z.array(z.any()),
    hintsUsed: z.array(z.number()).optional(),
    timeSpent: z.number().optional()
  })
});

const hintSchema = z.object({
  body: z.object({
    scenarioId: z.string().min(1),
    hintIndex: z.number().int().min(0)
  })
});

router.get("/scenarios", protect, getScenarios);
router.get("/scenarios/:slug", protect, getScenarioBySlug);
router.post("/submit", protect, validate(submitSchema), submitChallenge);
router.post("/hint", protect, validate(hintSchema), useHint);
router.get("/leaderboard", protect, getLeaderboard);

export default router;
