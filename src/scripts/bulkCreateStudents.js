/**
 * bulkCreateStudents.js
 * ─────────────────────
 * Local-only script — NOT a server route.
 * Reads students.json, creates a DB account for each entry,
 * and emails the credentials via Brevo (same flow as the admin UI).
 *
 * Usage (from the /server directory):
 *   node src/scripts/bulkCreateStudents.js
 *   node src/scripts/bulkCreateStudents.js --dry-run   ← preview only, no DB writes
 *
 * Edit students.json before running:
 *   [
 *     { "name": "Alice Sharma", "email": "alice@example.com" },
 *     ...
 *   ]
 */

import "dotenv/config";
import crypto from "crypto";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

// ── resolve __dirname for ESM ────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── load student list ────────────────────────────────────────────────────────
const studentsFile = path.join(__dirname, "students.json");
const students = require(studentsFile);

if (!Array.isArray(students) || students.length === 0) {
  console.error("❌  students.json is empty or not a valid JSON array.");
  process.exit(1);
}

// ── dry-run flag ─────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");
if (DRY_RUN) {
  console.log("⚠️  DRY RUN — no accounts will be created or emails sent.\n");
}

// ── helpers (same logic as adminController.js) ────────────────────────────────
function generateStudentId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = (n) =>
    Array.from({ length: n }, () => chars[crypto.randomInt(chars.length)]).join("");
  return `CS-${rand(4)}-${rand(4)}`;
}

function generatePassword() {
  const upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower   = "abcdefghjkmnpqrstuvwxyz";
  const digits  = "23456789";
  const special = "@#$!";
  const rand = (s, n = 1) =>
    Array.from({ length: n }, () => s[crypto.randomInt(s.length)]).join("");
  const base =
    rand(upper, 2) + rand(lower, 3) + rand(digits, 2) + rand(special, 1) + rand(lower + digits, 2);
  return base.split("").sort(() => crypto.randomInt(3) - 1).join("");
}

// ── email sender (same as emailService.js) ───────────────────────────────────
async function sendEmail({ name, email, password, studentId }) {
  const brevoKey = process.env.BREVO_SMTP_KEY;
  const senderEmail = process.env.BREVO_USER;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  if (!brevoKey || !senderEmail) {
    throw new Error("BREVO_SMTP_KEY or BREVO_USER missing in .env");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": brevoKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { name: "CyberSage", email: senderEmail },
      to: [{ email, name }],
      subject: "Your CyberSage Exam Account — Credentials Inside",
      htmlContent: `
        <!DOCTYPE html><html><head><meta charset="UTF-8"/>
        <style>
          body{font-family:'Segoe UI',Arial,sans-serif;background:#050d1a;color:#d4e8ff;margin:0;padding:0}
          .wrapper{max-width:560px;margin:40px auto;background:#0a1426;border:1px solid rgba(0,255,159,.15);border-radius:16px;overflow:hidden}
          .header{background:#040d18;padding:32px;text-align:center;border-bottom:1px solid rgba(0,255,159,.12)}
          .header h1{color:#00ff9f;font-size:1.6rem;margin:12px 0 4px;letter-spacing:.04em}
          .header p{color:#4d7090;font-size:.85rem;margin:0}
          .body{padding:32px}
          .creds-box{background:#040d18;border:1px solid rgba(0,255,159,.25);border-radius:10px;padding:20px 24px;margin:20px 0}
          .cred-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)}
          .cred-row:last-child{border:none}
          .cred-label{font-size:.75rem;color:#4d7090;text-transform:uppercase;letter-spacing:.07em}
          .cred-value{font-family:'Courier New',monospace;font-size:1rem;color:#00ff9f;font-weight:700;letter-spacing:.06em}
          .notice{background:rgba(255,191,36,.08);border:1px solid rgba(255,191,36,.25);border-radius:8px;padding:14px 18px;margin-top:20px;font-size:.85rem;color:#fde68a;line-height:1.6}
          .footer{padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,.05);font-size:.78rem;color:#4d7090}
          .btn{display:inline-block;background:rgba(0,255,159,.16);color:#00ff9f;border:1px solid rgba(0,255,159,.4);padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:.9rem;margin-top:20px}
        </style></head><body>
        <div class="wrapper">
          <div class="header"><h1>CyberSage</h1><p>Intern Entry Exam Platform</p></div>
          <div class="body">
            <p>Hi <strong>${name}</strong>,</p>
            <p style="color:#4d7090;font-size:.9rem;line-height:1.7;">
              Your account has been created for the <strong style="color:#d4e8ff;">CyberSage Intern Entry Exam</strong>.
              Use the credentials below to sign in and begin your assessment.
            </p>
            <div class="creds-box">
              <div class="cred-row"><span class="cred-label">Student ID</span><span class="cred-value">${studentId}</span></div>
              <div class="cred-row"><span class="cred-label">Email</span><span class="cred-value">${email}</span></div>
              <div class="cred-row"><span class="cred-label">Password</span><span class="cred-value">${password}</span></div>
            </div>
            <div class="notice">
              ⚠ <strong>Important rules before you start:</strong><br/>
              • The exam is <strong>90 minutes</strong> — once started, the timer cannot be paused.<br/>
              • Switching or minimising the browser tab will <strong>auto-submit</strong> your exam immediately.<br/>
              • You have <strong>one attempt only</strong> — there are no retakes.<br/>
              • Keep these credentials private.
            </div>
            <div style="text-align:center;">
              <a class="btn" href="${clientUrl}/login">Sign In to Exam →</a>
            </div>
          </div>
          <div class="footer">CyberSage · Intern Assessment Platform<br/>Do not reply to this email.</div>
        </div>
        </body></html>
      `
    })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Brevo ${response.status}: ${body.message || JSON.stringify(body)}`);
  }
}

// ── User model (inline to avoid importing full app stack) ─────────────────────
import User from "../models/User.js";

// ── main ──────────────────────────────────────────────────────────────────────
async function run() {
  // Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error("❌  MONGODB_URI not set in .env"); process.exit(1); }

  if (!DRY_RUN) {
    await mongoose.connect(uri);
    console.log("✅  Connected to MongoDB\n");
  }

  // Column widths for the summary table
  const COL = { name: 20, email: 30, id: 14, pw: 12, status: 30 };
  const hr  = "─".repeat(Object.values(COL).reduce((a, b) => a + b + 3, 0));
  const pad = (s, n) => String(s ?? "").slice(0, n).padEnd(n);

  console.log(hr);
  console.log(
    pad("NAME", COL.name) + " | " +
    pad("EMAIL", COL.email) + " | " +
    pad("STUDENT ID", COL.id) + " | " +
    pad("PASSWORD", COL.pw) + " | " +
    pad("RESULT", COL.status)
  );
  console.log(hr);

  let created = 0, skipped = 0, failed = 0;

  for (const entry of students) {
    const name  = String(entry.name  ?? "").trim();
    const email = String(entry.email ?? "").toLowerCase().trim();

    if (!name || !email) {
      console.log(
        pad(name || "(missing)", COL.name) + " | " +
        pad(email || "(missing)", COL.email) + " | " +
        pad("—", COL.id) + " | " +
        pad("—", COL.pw) + " | " +
        pad("❌  Name or email missing", COL.status)
      );
      failed++;
      continue;
    }

    const studentId     = generateStudentId();
    const plainPassword = generatePassword();

    if (DRY_RUN) {
      console.log(
        pad(name, COL.name) + " | " +
        pad(email, COL.email) + " | " +
        pad(studentId, COL.id) + " | " +
        pad(plainPassword, COL.pw) + " | " +
        pad("(dry run — skipped)", COL.status)
      );
      created++;
      continue;
    }

    // Check for duplicate
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(
        pad(name, COL.name) + " | " +
        pad(email, COL.email) + " | " +
        pad(existing.studentId ?? "—", COL.id) + " | " +
        pad("—", COL.pw) + " | " +
        pad("⚠️  Already exists — skipped", COL.status)
      );
      skipped++;
      continue;
    }

    try {
      await User.create({ name, email, password: plainPassword, role: "student", studentId });
    } catch (err) {
      console.log(
        pad(name, COL.name) + " | " +
        pad(email, COL.email) + " | " +
        pad(studentId, COL.id) + " | " +
        pad(plainPassword, COL.pw) + " | " +
        pad(`❌  DB error: ${err.message}`, COL.status)
      );
      failed++;
      continue;
    }

    let emailStatus = "✅  Created — email sent";
    try {
      await sendEmail({ name, email, password: plainPassword, studentId });
    } catch (emailErr) {
      emailStatus = `✅  Created — email FAILED (${emailErr.message.slice(0, 40)})`;
      failed++;  // count as partial failure
      created++; // account still exists
      console.log(
        pad(name, COL.name) + " | " +
        pad(email, COL.email) + " | " +
        pad(studentId, COL.id) + " | " +
        pad(plainPassword, COL.pw) + " | " +
        pad(emailStatus, COL.status)
      );
      continue;
    }

    console.log(
      pad(name, COL.name) + " | " +
      pad(email, COL.email) + " | " +
      pad(studentId, COL.id) + " | " +
      pad(plainPassword, COL.pw) + " | " +
      pad(emailStatus, COL.status)
    );
    created++;
  }

  console.log(hr);
  console.log(`\nDone.  Created: ${created}  |  Skipped (exists): ${skipped}  |  Failed: ${failed}`);

  if (!DRY_RUN) await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
