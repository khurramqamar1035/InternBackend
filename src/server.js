import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import Scenario from "./models/Scenario.js";
import { scenarios } from "./data/scenarioData.js";

const autoSeed = async () => {
  const count = await Scenario.countDocuments();
  if (count === 0) {
    await Scenario.insertMany(scenarios);
    logger.info(`Auto-seeded ${scenarios.length} scenarios`);
  }
};

const start = async () => {
  try {
    await connectDB();
    await autoSeed();
    app.listen(env.port, () => {
      logger.info(`Server started`, { port: env.port, env: env.nodeEnv });
    });
  } catch (error) {
    logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  }
};

start();
