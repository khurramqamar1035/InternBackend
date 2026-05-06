import Scenario from "../models/Scenario.js";
import Progress from "../models/Progress.js";
import ExamSession from "../models/ExamSession.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildAnswerDetails(type, userAnswers, correctAnswers) {
  const details = [];
  if (!correctAnswers) return details; // guard: missing answers data
  if (type === "phishing" || type === "qa-bugs") {
    const map = type === "phishing" ? (correctAnswers.phishingMap ?? []) : (correctAnswers.bugMap ?? []);
    userAnswers.forEach((a, i) => {
      details.push({ questionIndex: i, userAnswer: Boolean(a), correctAnswer: Boolean(map[i]), isCorrect: Boolean(a) === Boolean(map[i]) });
    });
  } else {
    const map = correctAnswers.questionAnswers ?? [];
    userAnswers.forEach((a, i) => {
      details.push({ questionIndex: i, userAnswer: Number(a), correctAnswer: Number(map[i] ?? -1), isCorrect: Number(a) === Number(map[i] ?? -1) });
    });
  }
  return details;
}

// Scoring: 1 point per correct answer — 20 questions per scenario, 100 total across 5 scenarios.
function computePoints(answerDetails) {
  const correct = answerDetails.filter((d) => d.isCorrect).length;
  return { total: correct, timeBonus: 0 };
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
  const { scenarioId, answers, hintsUsed = [] } = req.body;
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
  if (!scenario.answers) {
    logger.error("Scenario missing answers data — has the DB been seeded?", { scenarioId, slug: scenario.slug });
    return res.status(500).json({ message: "Scenario configuration error. Please contact the administrator." });
  }

  // ── Guard: already submitted this scenario (one attempt only) ────────────
  const existing = await Progress.findOne({ user: userId, scenario: scenarioId });
  if (existing && existing.status === "completed") {
    logger.security("Blocked re-submission of locked scenario", { userId, scenarioId });
    return res.status(409).json({ message: "This scenario has already been submitted." });
  }

  // ── Score: 1 point per correct answer ────────────────────────────────────
  const answerDetails = buildAnswerDetails(scenario.type, answers, scenario.answers);
  const { total, timeBonus } = computePoints(answerDetails);

  const validHints = hintsUsed
    .filter((i) => i >= 0 && i < (scenario.hints?.length ?? 0))
    .map((i) => ({ hintIndex: i, cost: scenario.hints[i].cost }));

  await Progress.findOneAndUpdate(
    { user: userId, scenario: scenarioId },
    {
      $inc: { attempts: 1 },
      $set: {
        status: "completed",
        flagCaptured: true,
        pointsEarned: total,
        timeBonus,
        hintsUsed: validHints,
        answerDetails,
        completedAt: new Date(),
        lastPlayedAt: new Date()
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Sync exam session totals
  const allProgress = await Progress.find({ user: userId, flagCaptured: true });
  session.totalPoints = allProgress.reduce((s, p) => s + p.pointsEarned, 0);
  session.flagsCaptured = allProgress.length;
  await session.save();

  logger.security("Scenario submitted", { userId, scenarioId, scenario: scenario.slug, pointsEarned: total, outOf: answers.length });
  res.json({ correct: true, pointsEarned: total, timeBonus, totalQuestions: answers.length });
});

export const useHint = asyncHandler(async (req, res) => {
  const { scenarioId, hintIndex } = req.body;
  const scenario = await Scenario.findById(scenarioId).select("hints");
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });
  const hint = scenario.hints[hintIndex];
  if (!hint) return res.status(404).json({ message: "Hint not found" });
  res.json({ hint: { text: hint.text, cost: hint.cost }, hintIndex });
});

// Public leaderboard removed — scores are admin-only.
