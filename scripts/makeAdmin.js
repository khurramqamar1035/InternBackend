/**
 * makeAdmin.js — Promote a user to admin role
 *
 * Usage:
 *   node scripts/makeAdmin.js your@email.com
 *
 * Run from inside the /server directory.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const email = process.argv[2];
if (!email) {
  console.error("❌  Usage: node scripts/makeAdmin.js <email>");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const result = await mongoose.connection
  .collection("users")
  .updateOne({ email }, { $set: { role: "admin" } });

if (result.matchedCount === 0) {
  console.error(`❌  No user found with email: ${email}`);
} else if (result.modifiedCount === 0) {
  console.log(`ℹ️   ${email} is already an admin.`);
} else {
  console.log(`✅  ${email} has been promoted to admin.`);
}

await mongoose.disconnect();
