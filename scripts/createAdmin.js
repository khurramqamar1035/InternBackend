/**
 * createAdmin.js — Create the first admin account from scratch
 *
 * Usage (run from inside the /server directory):
 *   node scripts/createAdmin.js <name> <email> <password>
 *
 * Example:
 *   node scripts/createAdmin.js "Khurram" "khurram@company.com" "MySecret123!"
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const [,, name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error("❌  Usage: node scripts/createAdmin.js <name> <email> <password>");
  console.error('    Example: node scripts/createAdmin.js "Khurram" "admin@company.com" "MySecret123!"');
  process.exit(1);
}

if (password.length < 8) {
  console.error("❌  Password must be at least 8 characters.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const existing = await mongoose.connection
  .collection("users")
  .findOne({ email: email.toLowerCase() });

if (existing) {
  console.error(`❌  A user with email "${email}" already exists.`);
  await mongoose.disconnect();
  process.exit(1);
}

const hashedPassword = await bcrypt.hash(password, 12);

await mongoose.connection.collection("users").insertOne({
  name: name.trim(),
  email: email.toLowerCase().trim(),
  password: hashedPassword,
  role: "admin",
  studentId: null,
  isEmailVerified: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

console.log(`✅  Admin account created successfully.`);
console.log(`    Name  : ${name}`);
console.log(`    Email : ${email}`);
console.log(`    Role  : admin`);
console.log(`\n    You can now log in at /login with these credentials.`);

await mongoose.disconnect();
