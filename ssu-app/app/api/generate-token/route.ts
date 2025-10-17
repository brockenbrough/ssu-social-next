import { NextRequest, NextResponse } from "next/server";
import { verifyToken, DecodedUser } from "../../../middleware/verifyToken";
import { generateAccessToken } from "../../../utilities/generateToken";

//method extends LOGIN LIFE of the ACCESSTOKEN , cannot be EXPIRED
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyToken(req);

    // If it's an error response, return it
    if ('status' in decoded) return decoded;

    const { id, email, username, role } = decoded as DecodedUser;

    const newAccessToken = generateAccessToken(id, email!, username!, role);

    return NextResponse.json({ accessToken: newAccessToken }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
