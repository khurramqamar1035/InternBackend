import express from "express";
import { z } from "zod";
import { getMyProgress, saveScenarioProgress } from "../controllers/progressController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

const progressSchema = z.object({
  body: z.object({
    scenarioId: z.string().min(1),
    status: z.enum(["not_started", "in_progress", "completed", "failed"]),
    score: z.number().min(0).max(100),
    healthRemaining: z.number().min(0).max(100)
  })
});

router.get("/me", protect, getMyProgress);
router.post("/save", protect, validate(progressSchema), saveScenarioProgress);

export default router;
