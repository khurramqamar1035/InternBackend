import crypto from "crypto";
import User from "../models/User.js";
import ExamSession from "../models/ExamSession.js";
import Progress from "../models/Progress.js";
import Scenario from "../models/Scenario.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendStudentCredentials } from "../utils/emailService.js";
import { logger } from "../utils/logger.js";

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
    logger.info("Student credentials emailed", { studentId, email: user.email });
  } catch (emailErr) {
    logger.error("Email delivery failed", { studentId, email: user.email, error: emailErr.message });
  }

  logger.security("Admin created student account", {
    adminId: req.user._id,
    studentId,
    email: user.email,
    emailSent
  });

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
  logger.security("Admin updated scenario", { adminId: req.user._id, scenarioId: id, title: scenario.title });
  res.json({ message: "Scenario updated.", scenario });
});

// GET /api/admin/students
// Returns all non-admin users with their exam session status
export const getStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: { $ne: "admin" } })
    .select("name email studentId avatar skills examEnabled createdAt")
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
      avatar: student.avatar ?? null,
      skills: student.skills ?? [],
      examEnabled: student.examEnabled ?? false,
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

  const student = await User.findById(userId).select("name email studentId avatar skills examEnabled").lean();
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
// POST /api/admin/students/:userId/pardon
// Allows admin to let a tab-violated student resume their exam
export const pardonExam = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const student = await User.findById(userId).lean();
  if (!student) return res.status(404).json({ message: "Student not found." });

  const session = await ExamSession.findOne({ user: userId });
  if (!session) return res.status(404).json({ message: "No exam session found for this student." });

  if (!session.tabViolation) {
    return res.status(400).json({ message: "This student has no tab violation to pardon." });
  }
  if (!session.isCompleted) {
    return res.status(400).json({ message: "Exam is not completed — no pardon needed." });
  }

  // Calculate remaining time the student had when the violation occurred.
  // If completedAt is set, use endsAt - completedAt. Otherwise give 10 min grace.
  const MIN_GRACE_MS = 10 * 60 * 1000; // 10 minutes minimum
  let remaining = session.completedAt
    ? session.endsAt.getTime() - session.completedAt.getTime()
    : MIN_GRACE_MS;
  if (remaining < MIN_GRACE_MS) remaining = MIN_GRACE_MS;

  const newEndsAt = new Date(Date.now() + remaining);

  session.isCompleted  = false;
  session.tabViolation = false;
  session.completedAt  = null;
  session.endsAt       = newEndsAt;
  session.adminPardoned = true;
  session.pardons.push({ grantedBy: req.user._id, grantedAt: new Date(), newEndsAt });

  await session.save();

  logger.security("Admin pardoned tab violation", {
    adminId: req.user._id,
    studentId: userId,
    newEndsAt,
    remainingMinutes: Math.round(remaining / 60000)
  });

  res.json({
    message: `Exam resumed. ${student.name} has ${Math.round(remaining / 60000)} minutes remaining.`,
    session
  });
});

// PUT /api/admin/students/:userId/exam-access — toggle or explicitly set examEnabled
export const toggleExamAccess = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const student = await User.findById(userId);
  if (!student || student.role === "admin") {
    return res.status(404).json({ message: "Student not found." });
  }

  // If body contains explicit `enabled` boolean use it; otherwise toggle
  const newState = req.body.enabled !== undefined
    ? Boolean(req.body.enabled)
    : !student.examEnabled;

  student.examEnabled = newState;
  await student.save();

  logger.security("Admin toggled exam access", {
    adminId: req.user._id,
    studentId: userId,
    examEnabled: newState
  });

  res.json({
    message: `Exam access ${newState ? "unlocked" : "locked"} for ${student.name}.`,
    examEnabled: newState
  });
});

// GET /api/admin/leaderboard — Full leaderboard with points (admin-only)
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
