import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("Missing JWT secrets in environment variables");
}

export const generateAccessToken = (
  id: string,
  email?: string,
  username?: string,
  role?: string
) => {
  return jwt.sign({ id, email, username, role }, ACCESS_TOKEN_SECRET, {
    expiresIn: "60m",
  });
};

export const generateRefreshToken = (
  id: string,
  email?: string,
  username?: string,
  role?: string
) => {
  return jwt.sign({ id, email, username, role }, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};
