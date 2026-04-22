import dotenv from "dotenv";
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || "7d",
  cookieSecure: String(process.env.COOKIE_SECURE) === "true",
  // Brevo email — API key from Settings → SMTP & API → API Keys tab
  brevoUser: process.env.BREVO_USER,       // your Brevo sender email
  brevoSmtpKey: process.env.BREVO_SMTP_KEY,// API key (starts with xkeysib-)
  // Cloudinary — for profile photo uploads
  cloudinaryName:   process.env.CLOUDINARY_NAME,
  cloudinaryKey:    process.env.CLOUDINARY_KEY,
  cloudinarySecret: process.env.CLOUDINARY_SECRET
};

if (!env.mongodbUri) throw new Error("MONGODB_URI is missing");
if (!env.jwtAccessSecret) throw new Error("JWT_ACCESS_SECRET is missing");
if (!env.jwtRefreshSecret) throw new Error("JWT_REFRESH_SECRET is missing");
