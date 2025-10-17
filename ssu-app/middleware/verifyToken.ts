import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;

export interface DecodedUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}

export const verifyToken = (req: NextRequest): DecodedUser | NextResponse => {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ message: "Token missing or invalid" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as DecodedUser;

    if (!decoded.id) {
      return NextResponse.json(
        { message: "Token does not contain valid user information" },
        { status: 400 }
      );
    }

    return decoded;
  } catch {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 403 });
  }
};
