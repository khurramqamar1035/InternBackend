import crypto from "crypto";
import User from "../models/User.js";
import ExamSession from "../models/ExamSession.js";
import Progress from "../models/Progress.js";
import Scenario from "../models/Scenario.js";
// Scenario is already imported above — used by getAdminScenarios + updateScenario
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendStudentCredentials } from "../utils/emailService.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Generate a human-readable student ID like CS-X4K2-9YMZ */
function generateStudentId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = (n) =>
    Array.from({ length: n }, () => chars[crypto.randomInt(chars.length)]).join("");
  return `CS-${rand(4)}-${rand(4)}`;
}

/** Generate a secure random password like Cs@7x2Qp */
function generatePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@#$!";
  const rand = (s, n = 1) =>
    Array.from({ length: n }, () => s[crypto.randomInt(s.length)]).join("");

  // Guarantee at least one of each type, then pad to 10 chars total
  const base = rand(upper, 2) + rand(lower, 3) + rand(digits, 2) + rand(special, 1) + rand(lower + digits, 2);
  // Shuffle
  return base.split("").sort(() => crypto.randomInt(3) - 1).join("");
}

// POST /api/admin/students
// Admin creates a student account — generates ID + password, sends email
export const createStudent = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required." });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "A user with this email already exists." });
  }

  const studentId = generateStudentId();
  const plainPassword = generatePassword();

  // Do NOT pre-hash — the User model's pre-save hook handles hashing automatically.
  // Pre-hashing here would cause a double-hash and make the password unmatchable on login.
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: plainPassword,
    role: "student",
    studentId
  });

  // Send credentials via email (non-fatal — account is created regardless)
  let emailSent = false;
  try {
    await sendStudentCredentials({ name: user.name, email: user.email, password: plainPassword, studentId });
    emailSent = true;
  } catch (emailErr) {
    console.error("⚠ Email send failed:", emailErr.message);
    console.error("  → Check BREVO_USER and BREVO_SMTP_KEY in your .env file");
    console.error("  → Make sure nodemailer is installed: npm install nodemailer");
  }

  res.status(201).json({
    message: emailSent
      ? `Account created and credentials sent to ${email}.`
      : `Account created but email delivery failed. Share credentials manually.`,
    student: {
      _id: user._id,
      name: user.name,
      email: user.email,
      studentId,
      // Only returned here (once) so admin can copy if email fails
      temporaryPassword: emailSent ? undefined : plainPassword
    }
  });
});

// ── Scenario management ────────────────────────────────────────────────────────

// GET /api/admin/scenarios — all scenarios with answers visible
export const getAdminScenarios = asyncHandler(async (req, res) => {
  const scenarios = await Scenario.find({})
    .select("+answers +flag")
    .sort({ createdAt: 1 })
    .lean();
  res.json({ scenarios });
});

// PUT /api/admin/scenarios/:id — update content + answers for a scenario
export const updateScenario = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, answers, title, description } = req.body;

  const scenario = await Scenario.findById(id);
  if (!scenario) return res.status(404).json({ message: "Scenario not found." });

  if (title !== undefined) scenario.title = title;
  if (description !== undefined) scenario.description = description;
  if (content !== undefined) scenario.content = content;
  if (answers !== undefined) scenario.answers = answers;

  await scenario.save();
  res.json({ message: "Scenario updated.", scenario });
});

// GET /api/admin/students
// Returns all non-admin users with their exam session status
export const getStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: { $ne: "admin" } })
    .select("name email studentId createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const sessions = await ExamSession.find({
    user: { $in: students.map((s) => s._id) }
  }).lean();

  const sessionMap = {};
  sessions.forEach((s) => {
    sessionMap[String(s.user)] = s;
  });

  const result = students.map((student) => {
    const session = sessionMap[String(student._id)] || null;
    return {
      _id: student._id,
      name: student.name,
      email: student.email,
      studentId: student.studentId,
      createdAt: student.createdAt,
      examStatus: session
        ? session.isCompleted
          ? "completed"
          : "in_progress"
        : "not_started",
      totalPoints: session?.totalPoints ?? 0,
      flagsCaptured: session?.flagsCaptured ?? 0,
      tabViolation: session?.tabViolation ?? false,
      startedAt: session?.startedAt ?? null,
      completedAt: session?.completedAt ?? null,
      duration: session?.duration ?? null
    };
  });

  res.json({ students: result });
});

// GET /api/admin/students/:userId
// Returns full per-question breakdown for a specific student
export const getStudentDetail = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const student = await User.findById(userId).select("name email").lean();
  if (!student) return res.status(404).json({ message: "Student not found" });

  const session = await ExamSession.findOne({ user: userId }).lean();

  const progresses = await Progress.find({ user: userId })
    .populate("scenario", "title slug type category difficulty points")
    .lean();

  const challenges = progresses.map((p) => ({
    scenarioId: p.scenario?._id,
    title: p.scenario?.title ?? "Unknown",
    slug: p.scenario?.slug,
    type: p.scenario?.type,
    category: p.scenario?.category,
    difficulty: p.scenario?.difficulty,
    maxPoints: p.scenario?.points,
    status: p.status,
    flagCaptured: p.flagCaptured,
    pointsEarned: p.pointsEarned,
    timeBonus: p.timeBonus,
    attempts: p.attempts,
    wrongAttempts: p.wrongAttempts,
    hintsUsed: p.hintsUsed,
    answerDetails: p.answerDetails,
    completedAt: p.completedAt,
    lastPlayedAt: p.lastPlayedAt
  }));

  res.json({
    student,
    session: session ?? null,
    challenges
  });
});

// GET /api/admin/leaderboard
// Full leaderboard with points (admin-only)
export const getAdminLeaderboard = asyncHandler(async (req, res) => {
  const rows = await ExamSession.find({ isCompleted: true })
    .populate("user", "name email")
    .sort({ totalPoints: -1, flagsCaptured: -1 })
    .lean();

  const leaderboard = rows.map((row, i) => ({
    rank: i + 1,
    userId: row.user?._id,
    name: row.user?.name ?? "Unknown",
    email: row.user?.email ?? "",
    totalPoints: row.totalPoints,
    flagsCaptured: row.flagsCaptured,
    tabViolation: row.tabViolation,
    completedAt: row.completedAt
  }));

  res.json({ leaderboard });
});
