import { NextRequest, NextResponse } from "next/server";
import { verifyToken, DecodedUser } from "../../../middleware/verifyToken";
import { generateAccessToken } from "../../../utilities/generateToken";
import { corsHeaders } from "@/utilities/cors";

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

//method extends LOGIN LIFE of the ACCESSTOKEN , cannot be EXPIRED
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyToken(req);

    // If it's an error response, return it
    if ('status' in decoded) return decoded;

    const { id, email, username, role } = decoded as DecodedUser;

    const newAccessToken = generateAccessToken(id, email!, username!, role);

    return NextResponse.json({ accessToken: newAccessToken }, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401, headers: corsHeaders });
  }
}
