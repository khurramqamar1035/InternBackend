import mongoose from "mongoose";

const hintSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    cost: { type: Number, default: 10 }
  },
  { _id: false }
);

const scenarioSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["phishing", "social-engineering", "malware", "browser", "terminal", "code-review", "log-analysis", "qa-bugs"],
      required: true
    },
    type: {
      type: String,
      enum: ["phishing", "code-review", "log-analysis", "qa-bugs"],
      required: true
    },
    difficulty: {
      type: String,
      enum: ["basic", "intermediate", "advanced"],
      default: "basic"
    },
    points: { type: Number, default: 100 },
    timeLimit: { type: Number, default: 180 }, // seconds (used for time-bonus calc)
    hints: [hintSchema],
    content: { type: Object, required: true },          // sent to client — no answers
    answers: { type: Object, required: true, select: false }, // never sent to client
    flag: { type: String, required: true, select: false },    // never sent to client
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Scenario", scenarioSchema);
