import { verifyJWT } from "./utils/authorization.js";
import dotenv from "dotenv";

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET_KEY || "some_secret_code";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  const token = authHeader.slice(7).trim().replace(/^"|"$/g, "");
  const { payload, expired } = verifyJWT(token, ACCESS_TOKEN_SECRET);

  if (expired) {
    // Frontend knows to call /api/auth/refresh
    return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
  }

  if (!payload) {
    // Token is invalid (bad signature, malformed, etc.) — no point refreshing
    return res.status(401).json({ message: "Invalid token", code: "TOKEN_INVALID" });
  }

  req.user = payload;
  next();
}

