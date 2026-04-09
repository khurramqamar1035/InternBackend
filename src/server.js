import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import Scenario from "./models/Scenario.js";
import { scenarios } from "./data/scenarioData.js";

const autoSeed = async () => {
  const count = await Scenario.countDocuments();
  if (count === 0) {
    await Scenario.insertMany(scenarios);
    console.log(`✅ Auto-seeded ${scenarios.length} scenarios.`);
  }
};

const start = async () => {
  try {
    await connectDB();
    await autoSeed();
    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
