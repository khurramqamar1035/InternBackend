import mongoose from "mongoose";

const hintUsedSchema = new mongoose.Schema(
  { hintIndex: Number, cost: Number },
  { _id: false }
);

// Stores what the student selected for each question vs the correct answer
const answerDetailSchema = new mongoose.Schema(
  {
    questionIndex: Number,
    userAnswer: mongoose.Schema.Types.Mixed,
    correctAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scenario: { type: mongoose.Schema.Types.ObjectId, ref: "Scenario", required: true, index: true },
    examSession: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSession" },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "failed"],
      default: "not_started"
    },
    pointsEarned: { type: Number, default: 0 },
    timeBonus: { type: Number, default: 0 },
    hintsUsed: [hintUsedSchema],
    answerDetails: [answerDetailSchema], // per-question breakdown for admin view
    flagCaptured: { type: Boolean, default: false },
    wrongAttempts: { type: Number, default: 0 }, // how many wrong submissions
    attempts: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date },
    lastPlayedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, scenario: 1 }, { unique: true });

export default mongoose.model("Progress", progressSchema);
