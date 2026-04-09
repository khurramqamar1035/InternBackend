import Scenario from "../models/Scenario.js";
import Progress from "../models/Progress.js";
import ExamSession from "../models/ExamSession.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─── helpers ─────────────────────────────────────────────────────────────────

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
      details.push({
        questionIndex: i,
        userAnswer: Boolean(a),
        correctAnswer: Boolean(map[i]),
        isCorrect: Boolean(a) === Boolean(map[i])
      });
    });
  } else {
    const map = correctAnswers.questionAnswers;
    userAnswers.forEach((a, i) => {
      details.push({
        questionIndex: i,
        userAnswer: Number(a),
        correctAnswer: Number(map[i]),
        isCorrect: Number(a) === Number(map[i])
      });
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

// ─── public routes ────────────────────────────────────────────────────────────

export const getScenarios = asyncHandler(async (req, res) => {
  const scenarios = await Scenario.find({ isPublished: true })
    .select("title slug description category type difficulty points timeLimit hints")
    .sort({ createdAt: 1 });
  res.json({ scenarios });
});

export const getScenarioBySlug = asyncHandler(async (req, res) => {
  const scenario = await Scenario.findOne({ slug: req.params.slug, isPublished: true })
    .select("-answers -flag");
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });

  // Also return user's progress for this scenario so client can lock if already submitted
  const progress = await Progress.findOne(
    { user: req.user._id, scenario: scenario._id },
    "status flagCaptured"
  ).lean();

  res.json({ scenario, progress: progress ?? null });
});

// ─── submit challenge answers ─────────────────────────────────────────────────

export const submitChallenge = asyncHandler(async (req, res) => {
  const { scenarioId, answers, hintsUsed = [], timeSpent = 0 } = req.body;

  const scenario = await Scenario.findById(scenarioId).select("+answers +flag");
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });

  const correct = checkAnswers(scenario.type, answers, scenario.answers);
  const answerDetails = buildAnswerDetails(scenario.type, answers, scenario.answers);

  if (!correct) {
    // Mark as "failed" — this was the final submit (review is client-side only).
    // "failed" status prevents the scenario from being replayed.
    await Progress.findOneAndUpdate(
      { user: req.user._id, scenario: scenarioId },
      {
        $inc: { attempts: 1, wrongAttempts: 1 },
        $set: {
          lastPlayedAt: new Date(),
          status: "failed",
          answerDetails // overwrite with latest attempt
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ correct: false, message: "Incorrect answers — this scenario is now locked." });
  }

  const validHints = hintsUsed
    .filter((i) => i >= 0 && i < scenario.hints.length)
    .map((i) => ({ hintIndex: i, cost: scenario.hints[i].cost }));

  const { total, timeBonus } = computePoints(
    scenario.points,
    timeSpent,
    scenario.timeLimit,
    hintsUsed,
    scenario.hints
  );

  await Progress.findOneAndUpdate(
    { user: req.user._id, scenario: scenarioId },
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
    { upsert: true, new: true }
  );

  // sync exam session totals
  const session = await ExamSession.findOne({ user: req.user._id, isCompleted: false });
  if (session) {
    const allProgress = await Progress.find({ user: req.user._id, flagCaptured: true });
    session.totalPoints = allProgress.reduce((s, p) => s + p.pointsEarned, 0);
    session.flagsCaptured = allProgress.length;
    await session.save();
  }

  res.json({ correct: true, flag: scenario.flag, pointsEarned: total, timeBonus });
});

// ─── use a hint ───────────────────────────────────────────────────────────────

export const useHint = asyncHandler(async (req, res) => {
  const { scenarioId, hintIndex } = req.body;
  const scenario = await Scenario.findById(scenarioId).select("hints");
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });
  const hint = scenario.hints[hintIndex];
  if (!hint) return res.status(404).json({ message: "Hint not found" });
  res.json({ hint: { text: hint.text, cost: hint.cost }, hintIndex });
});

// ─── leaderboard (for students — no points shown) ────────────────────────────

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
