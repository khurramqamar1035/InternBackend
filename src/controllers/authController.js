import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signAccessToken, signRefreshToken } from "../utils/generateTokens.js";
import { hashToken } from "../utils/hashToken.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

// COOKIE_SECURE=true → production on HTTPS (Render). Requires sameSite:"none" for cross-origin.
// COOKIE_SECURE=false → local dev on http://localhost. Uses sameSite:"lax".
const secureCookies = env.cookieSecure;

const refreshCookieOptions = {
  httpOnly: true,
  secure: secureCookies,
  sameSite: secureCookies ? "none" : "lax",
  path: "/api/auth/refresh"
};

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, { ...refreshCookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", refreshCookieOptions);
};

const getIp = (req) => req.headers["x-forwarded-for"]?.split(",")[0] ?? req.ip;

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "Email already in use" });
  }
  const user = await User.create({ name, email, password, role: "user" });
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const decodedRefresh = jwt.decode(refreshToken);
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decodedRefresh.exp * 1000)
  });
  setRefreshCookie(res, refreshToken);
  logger.security("User registered", { userId: user._id, email: user.email, ip: getIp(req) });
  res.status(201).json({
    message: "Account created successfully",
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = getIp(req);

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    logger.security("Login failed — unknown email", { email, ip });
    // Same message as wrong password — don't reveal if email exists
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
  const decodedRefresh = jwt.decode(refreshToken);
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decodedRefresh.exp * 1000)
  });
  setRefreshCookie(res, refreshToken);

  logger.security("Login successful", { userId: user._id, email: user.email, role: user.role, ip });

  res.json({
    message: "Login successful",
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }
  const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
  const tokenHash = hashToken(refreshToken);
  const storedToken = await RefreshToken.findOne({ tokenHash, user: decoded.sub });
  if (!storedToken) {
    logger.security("Refresh token reuse or forgery attempt", { userId: decoded.sub, ip: getIp(req) });
    return res.status(401).json({ message: "Session invalid" });
  }
  const user = await User.findById(decoded.sub);
  if (!user) {
    return res.status(401).json({ message: "Session invalid" });
  }
  // Rotate: delete old, issue new
  await RefreshToken.deleteOne({ _id: storedToken._id });
  const nextRefreshToken = signRefreshToken(user);
  const nextAccessToken = signAccessToken(user);
  const nextDecoded = jwt.decode(nextRefreshToken);
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(nextRefreshToken),
    expiresAt: new Date(nextDecoded.exp * 1000)
  });
  setRefreshCookie(res, nextRefreshToken);
  res.json({
    accessToken: nextAccessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
  }
  clearRefreshCookie(res);
  res.json({ message: "Logged out successfully" });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});
