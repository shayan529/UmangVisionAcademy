import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret"

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
};