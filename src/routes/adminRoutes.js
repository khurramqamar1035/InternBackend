import express from "express";
import {
  createStudent, getStudents, getStudentDetail, getAdminLeaderboard,
  getAdminScenarios, updateScenario
} from "../controllers/adminController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

// Students
router.post("/students", createStudent);
router.get("/students", getStudents);
router.get("/students/:userId", getStudentDetail);

// Leaderboard
router.get("/leaderboard", getAdminLeaderboard);

// Scenarios / Tests
router.get("/scenarios", getAdminScenarios);
router.put("/scenarios/:id", updateScenario);

export default router;
