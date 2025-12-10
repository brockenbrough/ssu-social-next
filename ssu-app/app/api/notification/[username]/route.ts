import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

// CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> } 
) {
  try {
    // Extract username from params
    const { username } = await ctx.params;

    // Fetch user_id from username
    const users = await sql<{ user_id: string }[]>`
      SELECT user_id
      FROM ssu_users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const userId = users[0].user_id;

    // Fetch notifications from DB
    const rows = await sql<{
      notification_id: string;
      notification_type: string;
      content: string;
      action_user_id: string | null;
      post_id: string | null;
      is_read: boolean;
      created_at: string;
      action_username: string | null;
    }[]>`
      SELECT 
        n.notification_id,
        n.notification_type,
        n.content,
        n.action_user_id,
        n.post_id,
        n.is_read,
        n.created_at,
        au.username AS action_username
      FROM notifications n
      LEFT JOIN ssu_users au 
        ON n.action_user_id = au.user_id
      WHERE n.user_id = ${userId}
      ORDER BY n.created_at DESC
    `;

    // FE EXPECTS THESE EXACT FIELDS:
    // _id, type, text, isRead, postId
    const notifications = rows.map((n) => ({
      _id: n.notification_id,
      type: n.notification_type,   // "like", "comment", "follow"
      text: n.content,             // Notification text
      isRead: n.is_read,
      postId: n.post_id,
      createdAt: n.created_at,
      actionUsername: n.action_username,
    }));

    return NextResponse.json(
      { notifications },
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error("Error fetching notifications:", err);
    return NextResponse.json(
      { error: "Could not fetch notifications" },
      { status: 500, headers: corsHeaders }
    );
  }
}