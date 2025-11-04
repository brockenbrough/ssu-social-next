import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// DELETE /followers/unfollow
export async function DELETE(req: Request) {
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
        { success: false, message: "Cannot unfollow yourself" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔍 Step 1: Get user IDs from ssu_users
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

    // ❌ Step 2: Remove the follower relationship if it exists
    const result = await sql`
      DELETE FROM followers
      WHERE user_id = ${targetUserId}::uuid
      AND follower_id = ${userId}::uuid
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `${username} was not following ${targetUsername}`,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${username} successfully unfollowed ${targetUsername}`,
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
