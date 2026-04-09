import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role
    },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenExpires }
  );
};

export const signRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tokenType: "refresh"
    },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenExpires }
  );
};
