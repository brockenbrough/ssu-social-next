import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// POST /api/followers/follow
export async function POST(req: Request) {
  try {
    const { userId, targetUserId } = await req.json();

    // Validate presence
    if (!userId || !targetUserId) {
      return NextResponse.json(
        { success: false, message: "Both userId and targetUserId are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Prevent self-follow
    if (userId === targetUserId) {
      return NextResponse.json(
        { success: false, message: "You cannot follow yourself" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Lookup follower user
    const [followerUser] = await sql`
      SELECT user_id FROM ssu_users WHERE username = ${userId} OR user_id::text = ${userId}
    `;
    // Lookup target user
    const [targetUser] = await sql`
      SELECT user_id FROM ssu_users WHERE username = ${targetUserId} OR user_id::text = ${targetUserId}
    `;

    if (!followerUser || !targetUser) {
      return NextResponse.json(
        { success: false, message: "User or target not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const followerUUID = followerUser.user_id;
    const targetUUID = targetUser.user_id;

    // Insert follow relationship if not already existing
    const result = await sql`
      INSERT INTO followers (user_id, follower_id, created_at)
      SELECT ${targetUUID}::uuid, ${followerUUID}::uuid, NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM followers
        WHERE user_id = ${targetUUID}::uuid
        AND follower_id = ${followerUUID}::uuid
      )
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: true, message: "Already following" },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${userId} successfully followed ${targetUserId}`,
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
