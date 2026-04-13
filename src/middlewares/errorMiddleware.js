import { logger } from "../utils/logger.js";

export const notFound = (req, res) => {
  // Don't expose the full path — could leak internal routing info
  res.status(404).json({ message: "Resource not found" });
};

export const errorHandler = (err, req, res, next) => {
  // Always log server errors with full detail server-side
  logger.error("Unhandled error", {
    message: err.message,
    name: err.name,
    method: req.method,
    url: req.originalUrl,
    user: req.user?._id ?? "unauthenticated",
    // Stack only in dev — never log to production stdout for security
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });

  // Known auth errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Session expired" });
  }

  // Mongoose validation / cast errors
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Invalid data submitted" });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ message: "A record with this value already exists" });
  }

  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // In production: never leak internal error messages or stack traces
  const message = process.env.NODE_ENV === "production" && status === 500
    ? "Something went wrong. Please try again."
    : (err.message || "Server error");

  res.status(status).json({ message });
};
