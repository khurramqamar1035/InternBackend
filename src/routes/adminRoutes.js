import express from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import {
  createStudent, getStudents, getStudentDetail, getAdminLeaderboard,
  getAdminScenarios, updateScenario, pardonExam, toggleExamAccess
} from "../controllers/adminController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";

const router = express.Router();

// All admin routes require authenticated admin role
router.use(protect, authorize("admin"));

// Limit student creation — prevent accidental spam
const createStudentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { message: "Too many accounts created. Please wait before adding more." },
  standardHeaders: true,
  legacyHeaders: false
});

const createStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80).trim(),
    email: z.string().email().max(200).toLowerCase()
  })
});

const updateScenarioSchema = z.object({
  body: z.object({
    title:       z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    content:     z.record(z.any()).optional(),
    answers:     z.record(z.any()).optional()
  })
});

// Students
router.post("/students",                    createStudentLimiter, validate(createStudentSchema), createStudent);
router.get("/students",                     getStudents);
router.get("/students/:userId",             getStudentDetail);
router.post("/students/:userId/pardon",     pardonExam);
router.put("/students/:userId/exam-access", toggleExamAccess);

// Leaderboard
router.get("/leaderboard",       getAdminLeaderboard);

// Scenarios / Tests
router.get("/scenarios",         getAdminScenarios);
router.put("/scenarios/:id",     validate(updateScenarioSchema), updateScenario);

export default router;
