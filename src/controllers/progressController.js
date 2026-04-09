import Progress from "../models/Progress.js";
import Scenario from "../models/Scenario.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMyProgress = asyncHandler(async (req, res) => {
  const progress = await Progress.find({ user: req.user._id })
    .populate("scenario", "title slug category difficulty")
    .sort({ updatedAt: -1 });
  res.json({ progress });
});

export const saveScenarioProgress = asyncHandler(async (req, res) => {
  const { scenarioId, status, score, healthRemaining } = req.body;
  const scenario = await Scenario.findById(scenarioId);
  if (!scenario) {
    return res.status(404).json({ message: "Scenario not found" });
  }
  const progress = await Progress.findOneAndUpdate(
    { user: req.user._id, scenario: scenarioId },
    {
      $set: {
        status,
        score,
        healthRemaining,
        lastPlayedAt: new Date()
      },
      $inc: { attempts: 1 }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
  res.json({ message: "Progress saved", progress });
});
