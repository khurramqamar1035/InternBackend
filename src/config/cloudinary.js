import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

cloudinary.config({
  cloud_name: env.cloudinaryName,
  api_key:    env.cloudinaryKey,
  api_secret: env.cloudinarySecret
});

export default cloudinary;
