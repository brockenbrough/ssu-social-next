import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// DELETE /followers/unfollow
export async function DELETE(req: NextRequest) {
  try {
    // Read JSON body from the request
    const body = await req.json();

    // Frontend sends:
    // {
    //   "userId": "<currentUsername>",
    //   "targetUserId": "<profileUsername>"
    // }
    //
    // Old code / tests might send:
    // {
    //   "username": "<currentUsername>",
    //   "targetUsername": "<profileUsername>"
    // }
    //
    // Support both formats to avoid future mismatch.
    const username = body.username ?? body.userId;
    const targetUsername = body.targetUsername ?? body.targetUserId;

    // For debugging if needed:
    // console.log("UNFOLLOW body:", body);
    // console.log("UNFOLLOW username:", username, "targetUsername:", targetUsername);

    // Both usernames are required
    if (!username || !targetUsername) {
      return NextResponse.json(
        { success: false, message: "Both usernames are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // A user cannot unfollow themselves
    if (username === targetUsername) {
      return NextResponse.json(
        { success: false, message: "Cannot unfollow yourself" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch both user IDs via their usernames from ssu_users
    const users = await sql`
      SELECT user_id, username
      FROM ssu_users
      WHERE username IN (${username}, ${targetUsername})
    `;

    if (users.length !== 2) {
      return NextResponse.json(
        { success: false, message: "One or both usernames do not exist" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Map usernames → user_id
    const userIdMap: Record<string, string> = {};
    users.forEach((u: any) => {
      userIdMap[u.username] = u.user_id;
    });

    const fetchedUserId = userIdMap[username];           // follower
    const fetchedTargetUserId = userIdMap[targetUsername]; // user being unfollowed

    // Delete the follower relationship if it exists
    const result = await sql`
      DELETE FROM followers
      WHERE user_id = ${fetchedTargetUserId}
      AND follower_id = ${fetchedUserId}
      RETURNING *
    `;

    // If nothing was deleted, the follower relationship didn't exist
    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `${username} was not following ${targetUsername}`,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Successful unfollow
    return NextResponse.json(
      {
        success: true,
        message: `${username} successfully unfollowed ${targetUsername}`,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Error in /followers/unfollow:", err);
    return NextResponse.json(
      { success: false, message: err?.message ?? String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
}
