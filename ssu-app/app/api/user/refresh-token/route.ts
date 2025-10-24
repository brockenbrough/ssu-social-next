// ssu-app/app/api/user/refresh-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "@/utilities/generateToken";
import { corsHeaders } from "@/utilities/cors";

//this method checks if you have a refresh token and then gives you a new acces and refresh token
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

interface DecodedUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}

// Helper to verify the refresh token
const verifyRefreshToken = (token: string): DecodedUser => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as DecodedUser;
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }
};

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { message: "No refresh token provided" },
        { status: 401, headers: corsHeaders }
      );
    }

    const decoded = verifyRefreshToken(refreshToken);
    const { id, email, username, role } = decoded;

    // Generate new tokens
    const newAccessToken = generateAccessToken(id, email!, username!, role);
    const newRefreshToken = generateRefreshToken(id, email!, username!, role);

    return NextResponse.json(
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message },
      { status: 403, headers: corsHeaders }
    );
  }
}