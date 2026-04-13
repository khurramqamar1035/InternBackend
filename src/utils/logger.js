/**
 * Structured logger — outputs JSON lines to stdout (Render captures these).
 * Levels: info | warn | error | security
 * Security events are always logged regardless of environment.
 */

const isProd = process.env.NODE_ENV === "production";

function write(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta && Object.keys(meta).length ? { meta } : {})
  };
  // In production always use JSON; in dev keep it readable
  if (isProd) {
    process.stdout.write(JSON.stringify(entry) + "\n");
  } else {
    const color = { info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m", security: "\x1b[35m" }[level] || "";
    const reset = "\x1b[0m";
    const metaStr = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
    process.stdout.write(`${color}[${level.toUpperCase()}]${reset} ${message}${metaStr}\n`);
  }
}

export const logger = {
  info:     (msg, meta = {}) => write("info",     msg, meta),
  warn:     (msg, meta = {}) => write("warn",     msg, meta),
  error:    (msg, meta = {}) => write("error",    msg, meta),
  /** Always logged — use for login attempts, exam events, admin actions */
  security: (msg, meta = {}) => write("security", msg, meta),
};
