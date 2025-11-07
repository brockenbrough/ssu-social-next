import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// POST /followers/follow
export async function POST(req: Request) {
  try {
    const { username, targetUsername } = await req.json();

    if (!username || !targetUsername) {
      return NextResponse.json(
        { success: false, message: "Both usernames are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (username === targetUsername) {
      return NextResponse.json(
        { success: false, message: "Cannot follow yourself" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔍 Step 1: Look up user IDs based on usernames from ssu_users
    const [user] = await sql`
      SELECT user_id FROM ssu_users WHERE username = ${username}
    `;
    const [targetUser] = await sql`
      SELECT user_id FROM ssu_users WHERE username = ${targetUsername}
    `;

    if (!user || !targetUser) {
      return NextResponse.json(
        { success: false, message: "One or both usernames do not exist" },
        { status: 404, headers: corsHeaders }
      );
    }

    const userId = user.user_id;
    const targetUserId = targetUser.user_id;

    // 🔁 Step 2: Insert follower relationship if not exists
    await sql`
      INSERT INTO followers (user_id, follower_id, created_at)
      SELECT ${targetUserId}::uuid, ${userId}::uuid, NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM followers
        WHERE user_id = ${targetUserId}::uuid
        AND follower_id = ${userId}::uuid
      )
    `;

    return NextResponse.json(
      {
        success: true,
        data: { follower: username, following: targetUsername },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
}
