import express from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { register, login, refresh, logout, me, updateSkills, updateAvatar } from "../controllers/authController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadAvatar } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests, try again later" }
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128)
  })
});

const skillsSchema = z.object({
  body: z.object({
    skills: z.array(z.string().max(50)).max(10)
  })
});

router.post("/login",   authLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout",  logout);
router.get("/me",       protect, me);
router.put("/skills",   protect, validate(skillsSchema), updateSkills);
router.put("/avatar",   protect, uploadAvatar.single("avatar"), updateAvatar);

export default router;
