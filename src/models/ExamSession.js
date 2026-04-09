import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    startedAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true },
    duration: { type: Number, default: 30 }, // minutes
    totalPoints: { type: Number, default: 0 },
    flagsCaptured: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    tabViolation: { type: Boolean, default: false } // auto-finished due to tab switch
  },
  { timestamps: true }
);

export default mongoose.model("ExamSession", examSessionSchema);
