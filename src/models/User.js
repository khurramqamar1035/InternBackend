import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["user", "student", "admin"], default: "student" },
    studentId: { type: String, unique: true, sparse: true },
    skills: { type: [String], default: [] },          // student-editable, max 10
    avatar: { type: String, default: null },           // Cloudinary URL
    examEnabled: { type: Boolean, default: false },    // admin unlocks exam per student
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
