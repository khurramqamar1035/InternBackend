import ExamSession from "../models/ExamSession.js";
import Progress from "../models/Progress.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const EXAM_DURATION_MINUTES = 30;

export const startExam = asyncHandler(async (req, res) => {
  const existing = await ExamSession.findOne({ user: req.user._id });
  if (existing) {
    // If already completed, block retake
    if (existing.isCompleted) {
      return res.status(409).json({ message: "You have already completed the exam. No retakes allowed.", session: existing });
    }
    return res.status(409).json({ message: "You already have an active exam session.", session: existing });
  }
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + EXAM_DURATION_MINUTES * 60 * 1000);
  const session = await ExamSession.create({
    user: req.user._id,
    startedAt,
    endsAt,
    duration: EXAM_DURATION_MINUTES
  });
  res.status(201).json({ session });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await ExamSession.findOne({ user: req.user._id });
  if (!session) return res.status(404).json({ message: "No exam session found." });

  // auto-complete if time has run out
  if (!session.isCompleted && new Date() > session.endsAt) {
    session.isCompleted = true;
    session.completedAt = session.endsAt;
    await session.save();
  }

  res.json({ session });
});

export const completeExam = asyncHandler(async (req, res) => {
  const session = await ExamSession.findOne({ user: req.user._id });
  if (!session) return res.status(404).json({ message: "No exam session found." });
  if (session.isCompleted) return res.json({ session, message: "Already completed." });

  session.isCompleted = true;
  session.completedAt = new Date();

  const allProgress = await Progress.find({ user: req.user._id, flagCaptured: true });
  session.totalPoints = allProgress.reduce((s, p) => s + p.pointsEarned, 0);
  session.flagsCaptured = allProgress.length;

  await session.save();
  res.json({ session, message: "Exam completed." });
});

// Called when student switches tab — auto-finishes exam with tabViolation flag
export const tabFinish = asyncHandler(async (req, res) => {
  const session = await ExamSession.findOne({ user: req.user._id });
  if (!session) return res.status(404).json({ message: "No exam session found." });
  if (session.isCompleted) return res.json({ session, message: "Already completed." });

  session.isCompleted = true;
  session.completedAt = new Date();
  session.tabViolation = true;

  const allProgress = await Progress.find({ user: req.user._id, flagCaptured: true });
  session.totalPoints = allProgress.reduce((s, p) => s + p.pointsEarned, 0);
  session.flagsCaptured = allProgress.length;

  await session.save();
  res.json({ session, message: "Exam auto-completed due to tab switch." });
});
