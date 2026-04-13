import Scenario from "../models/Scenario.js";
import Progress from "../models/Progress.js";
import ExamSession from "../models/ExamSession.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

function checkAnswers(type, userAnswers, correctAnswers) {
  if (!Array.isArray(userAnswers)) return false;
  if (type === "phishing") {
    const map = correctAnswers.phishingMap;
    if (!map || userAnswers.length !== map.length) return false;
    return userAnswers.every((a, i) => Boolean(a) === Boolean(map[i]));
  }
  if (type === "code-review" || type === "log-analysis") {
    const map = correctAnswers.questionAnswers;
    if (!map || userAnswers.length !== map.length) return false;
    return userAnswers.every((a, i) => Number(a) === Number(map[i]));
  }
  if (type === "qa-bugs") {
    const map = correctAnswers.bugMap;
    if (!map || userAnswers.length !== map.length) return false;
    return userAnswers.every((a, i) => Boolean(a) === Boolean(map[i]));
  }
  return false;
}

function buildAnswerDetails(type, userAnswers, correctAnswers) {
  const details = [];
  if (type === "phishing" || type === "qa-bugs") {
    const map = type === "phishing" ? correctAnswers.phishingMap : correctAnswers.bugMap;
    userAnswers.forEach((a, i) => {
      details.push({ questionIndex: i, userAnswer: Boolean(a), correctAnswer: Boolean(map[i]), isCorrect: Boolean(a) === Boolean(map[i]) });
    });
  } else {
    const map = correctAnswers.questionAnswers;
    userAnswers.forEach((a, i) => {
      details.push({ questionIndex: i, userAnswer: Number(a), correctAnswer: Number(map[i]), isCorrect: Number(a) === Number(map[i]) });
    });
  }
  return details;
}

function computePoints(basePoints, timeSpent, timeLimit, hintsUsed, hints) {
  const timeFraction = Math.max(0, 1 - timeSpent / timeLimit);
  const timeBonus = Math.floor(basePoints * 0.5 * timeFraction);
  const hintCost = hintsUsed.reduce((sum, idx) => sum + (hints[idx]?.cost ?? 0), 0);
  return { total: Math.max(10, basePoints + timeBonus - hintCost), timeBonus };
}

// ─── routes ───────────────────────────────────────────────────────────────────

export const getScenarios = asyncHandler(async (req, res) => {
  const scenarios = await Scenario.find({ isPublished: true })
    .select("title slug description category type difficulty points timeLimit hints")
    .sort({ createdAt: 1 });
  res.json({ scenarios });
});

export const getScenarioBySlug = asyncHandler(async (req, res) => {
  // Only allow alphanumeric slugs — reject anything suspicious
  if (!/^[a-z0-9-]+$/.test(req.params.slug)) {
    return res.status(400).json({ message: "Invalid scenario identifier" });
  }

  const scenario = await Scenario.findOne({ slug: req.params.slug, isPublished: true })
    .select("-answers -flag");
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });

  const progress = await Progress.findOne(
    { user: req.user._id, scenario: scenario._id },
    "status flagCaptured"
  ).lean();

  res.json({ scenario, progress: progress ?? null });
});

export const submitChallenge = asyncHandler(async (req, res) => {
  const { scenarioId, answers, hintsUsed = [], timeSpent = 0 } = req.body;
  const userId = req.user._id;

  // ── Exam session guard ────────────────────────────────────────────────────
  const session = await ExamSession.findOne({ user: userId });
  if (!session) {
    return res.status(403).json({ message: "No active exam session." });
  }
  if (session.isCompleted) {
    return res.status(403).json({ message: "Exam already completed." });
  }
  if (new Date() > session.endsAt) {
    // Time's up — auto-complete and reject
    session.isCompleted = true;
    session.completedAt = session.endsAt;
    await session.save();
    logger.security("Submission rejected — exam time expired", { userId, scenarioId });
    return res.status(403).json({ message: "Exam time has expired." });
  }

  // ── Scenario lookup ───────────────────────────────────────────────────────
  const scenario = await Scenario.findById(scenarioId).select("+answers +flag");
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });

  // ── Guard: already submitted this scenario ────────────────────────────────
  const existing = await Progress.findOne({ user: userId, scenario: scenarioId });
  if (existing && (existing.status === "completed" || existing.status === "failed")) {
    logger.security("Blocked re-submission of locked scenario", { userId, scenarioId, status: existing.status });
    return res.status(409).json({ message: "This scenario has already been submitted." });
  }

  const correct = checkAnswers(scenario.type, answers, scenario.answers);
  const answerDetails = buildAnswerDetails(scenario.type, answers, scenario.answers);

  if (!correct) {
    await Progress.findOneAndUpdate(
      { user: userId, scenario: scenarioId },
      { $inc: { attempts: 1, wrongAttempts: 1 }, $set: { lastPlayedAt: new Date(), status: "failed", answerDetails } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logger.info("Scenario submitted — incorrect", { userId, scenarioId, scenario: scenario.slug });
    return res.json({ correct: false, message: "Incorrect answers — this scenario is now locked." });
  }

  const validHints = hintsUsed
    .filter((i) => i >= 0 && i < scenario.hints.length)
    .map((i) => ({ hintIndex: i, cost: scenario.hints[i].cost }));

  const { total, timeBonus } = computePoints(scenario.points, timeSpent, scenario.timeLimit, hintsUsed, scenario.hints);

  await Progress.findOneAndUpdate(
    { user: userId, scenario: scenarioId },
    {
      $inc: { attempts: 1 },
      $set: { status: "completed", flagCaptured: true, pointsEarned: total, timeBonus, hintsUsed: validHints, answerDetails, completedAt: new Date(), lastPlayedAt: new Date() }
    },
    { upsert: true, new: true }
  );

  // Sync exam session totals
  const allProgress = await Progress.find({ user: userId, flagCaptured: true });
  session.totalPoints = allProgress.reduce((s, p) => s + p.pointsEarned, 0);
  session.flagsCaptured = allProgress.length;
  await session.save();

  logger.security("Flag captured", { userId, scenarioId, scenario: scenario.slug, points: total });
  res.json({ correct: true, flag: scenario.flag, pointsEarned: total, timeBonus });
});

export const useHint = asyncHandler(async (req, res) => {
  const { scenarioId, hintIndex } = req.body;
  const scenario = await Scenario.findById(scenarioId).select("hints");
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });
  const hint = scenario.hints[hintIndex];
  if (!hint) return res.status(404).json({ message: "Hint not found" });
  res.json({ hint: { text: hint.text, cost: hint.cost }, hintIndex });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const rows = await Progress.aggregate([
    { $match: { flagCaptured: true } },
    { $group: { _id: "$user", flagsCaptured: { $sum: 1 }, totalPoints: { $sum: "$pointsEarned" } } },
    { $sort: { flagsCaptured: -1, totalPoints: -1 } },
    { $limit: 100 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "u" } },
    { $unwind: "$u" },
    { $project: { _id: 0, userId: "$_id", name: "$u.name", flagsCaptured: 1 } }
  ]);
  res.json({ leaderboard: rows.map((r, i) => ({ rank: i + 1, ...r })) });
});
