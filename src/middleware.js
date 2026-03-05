import { verifyJWT } from "./utils/authorization.js";
import dotenv from "dotenv";

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET_KEY || "some_secret_code";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Отсутствует заголовок авторизации" });
  }
  const [schema, token] = authHeader.split(" ");
  if (schema != 'Bearer' || !token) {
    return res
      .status(401)
      .json({ message: "Неверный формат заголовка авторизации" });
  }

  const payload = verifyJWT(token, ACCESS_TOKEN_SECRET);
  console.log("Payload: ", payload);
  if (!payload) {
    return res.status(401).json({ message: "Не верный токен" });
  }
  req.user = payload;
  next();
}
