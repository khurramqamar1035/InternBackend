import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signAccessToken, signRefreshToken } from "../utils/generateTokens.js";
import { hashToken } from "../utils/hashToken.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import cloudinary from "../config/cloudinary.js";

const secureCookies = env.cookieSecure;
const refreshCookieOptions = {
  httpOnly: true,
  secure: secureCookies,
  sameSite: secureCookies ? "none" : "lax",
  path: "/api/auth/refresh"
};

const setRefreshCookie = (res, token) =>
  res.cookie("refreshToken", token, { ...refreshCookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

const clearRefreshCookie = (res) => res.clearCookie("refreshToken", refreshCookieOptions);
const getIp = (req) => req.headers["x-forwarded-for"]?.split(",")[0] ?? req.ip;

// Helper — consistent user shape returned to clients
export const userPayload = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  studentId: u.studentId ?? null,
  skills: u.skills ?? [],
  avatar: u.avatar ?? null,
  examEnabled: u.examEnabled ?? false
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ message: "Email already in use" });
  const user = await User.create({ name, email, password, role: "user" });
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const decoded = jwt.decode(refreshToken);
  await RefreshToken.create({ user: user._id, tokenHash: hashToken(refreshToken), expiresAt: new Date(decoded.exp * 1000) });
  setRefreshCookie(res, refreshToken);
  logger.security("User registered", { userId: user._id, email: user.email, ip: getIp(req) });
  res.status(201).json({ message: "Account created successfully", accessToken, user: userPayload(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = getIp(req);
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    logger.security("Login failed — unknown email", { email, ip });
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    logger.security("Login failed — wrong password", { userId: user._id, email, ip });
    return res.status(401).json({ message: "Invalid credentials" });
  }
  user.lastLoginAt = new Date();
  await user.save();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const decoded = jwt.decode(refreshToken);
  await RefreshToken.create({ user: user._id, tokenHash: hashToken(refreshToken), expiresAt: new Date(decoded.exp * 1000) });
  setRefreshCookie(res, refreshToken);
  logger.security("Login successful", { userId: user._id, email: user.email, role: user.role, ip });
  res.json({ message: "Login successful", accessToken, user: userPayload(user) });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token missing" });
  const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
  const tokenHash = hashToken(refreshToken);
  const stored = await RefreshToken.findOne({ tokenHash, user: decoded.sub });
  if (!stored) {
    logger.security("Refresh token reuse/forgery attempt", { userId: decoded.sub, ip: getIp(req) });
    return res.status(401).json({ message: "Session invalid" });
  }
  const user = await User.findById(decoded.sub);
  if (!user) return res.status(401).json({ message: "Session invalid" });
  await RefreshToken.deleteOne({ _id: stored._id });
  const nextRefresh = signRefreshToken(user);
  const nextAccess = signAccessToken(user);
  const nextDecoded = jwt.decode(nextRefresh);
  await RefreshToken.create({ user: user._id, tokenHash: hashToken(nextRefresh), expiresAt: new Date(nextDecoded.exp * 1000) });
  setRefreshCookie(res, nextRefresh);
  res.json({ accessToken: nextAccess, user: userPayload(user) });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
  clearRefreshCookie(res);
  res.json({ message: "Logged out successfully" });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ user: userPayload(user) });
});

// PUT /api/auth/skills — student updates their own skills list (max 10)
export const updateSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;
  if (!Array.isArray(skills)) return res.status(400).json({ message: "skills must be an array" });
  const cleaned = [...new Set(
    skills.map((s) => String(s).trim().slice(0, 50)).filter(Boolean)
  )].slice(0, 10);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { skills: cleaned },
    { new: true }
  );
  logger.info("Skills updated", { userId: user._id, count: cleaned.length });
  res.json({ message: "Skills updated", user: userPayload(user) });
});

// PUT /api/auth/avatar — upload profile photo to Cloudinary
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No image file uploaded." });

  // Delete old avatar from Cloudinary if it exists
  const existing = await User.findById(req.user._id);
  if (existing?.avatar) {
    try {
      // Extract public_id from Cloudinary URL (last path segment without extension)
      const parts = existing.avatar.split("/");
      const folder = parts[parts.length - 2];
      const publicId = `${folder}/${parts[parts.length - 1].split(".")[0]}`;
      await cloudinary.uploader.destroy(publicId);
    } catch {}
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.file.path },  // Cloudinary URL stored in req.file.path by multer-storage-cloudinary
    { new: true }
  );
  logger.info("Avatar updated", { userId: user._id });
  res.json({ message: "Avatar updated", user: userPayload(user) });
});
