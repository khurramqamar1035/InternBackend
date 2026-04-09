import express from "express";
import { startExam, getSession, completeExam, tabFinish } from "../controllers/examController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/start", protect, startExam);
router.get("/session", protect, getSession);
router.post("/complete", protect, completeExam);
router.post("/tab-finish", protect, tabFinish);

export default router;
