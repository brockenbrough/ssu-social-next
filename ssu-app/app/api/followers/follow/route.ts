import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

// Handle preflight (CORS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, targetUserId } = body;
    const userName = userId;
    const targetUserName = targetUserId;

    // Validate input
    if (!userName || !targetUserName) {
      return NextResponse.json(
        { error: "Missing username(s)" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (userName === targetUserName) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Lookup users by username
    const users = await sql`
      SELECT user_id, username
      FROM ssu_users
      WHERE username IN (${userName}, ${targetUserName})
    `;

    if (users.length !== 2) {
      return NextResponse.json(
        { error: "User(s) not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const userIdMap: Record<string, string> = {};
    users.forEach((u: any) => {
      userIdMap[u.username] = u.user_id;
    });

    const fetchedUserId = userIdMap[userName];
    const fetchedTargetUserId = userIdMap[targetUserName];

    // Check if already following
    const existing = await sql`
      SELECT 1 FROM followers
      WHERE user_id = ${fetchedTargetUserId} AND follower_id = ${fetchedUserId}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Already following" },
        { status: 200, headers: corsHeaders }
      );
    }

    // Insert follow record
    await sql`
      INSERT INTO followers (user_id, follower_id, created_at)
      VALUES (${fetchedTargetUserId}, ${fetchedUserId}, NOW())
    `;

    return NextResponse.json(
      { message: "Followed successfully" },
      { status: 201, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Error in /followers/follow:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
