import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

// ==========================
// CORS
// ==========================
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

/* =====================================================
   CREATE NOTIFICATION (POST)
   FE → POST /api/notification
   ===================================================== */
export async function POST(req: Request) {
  try {
    const body = await req.json();  // Only once

    // Accept BOTH FE format and BE format
    const notification_type = body.notification_type || body.type;
    const content = body.content || body.text;
    const post_id = body.post_id ?? body.postId ?? null;

    // -------------------------------------------
    // Lookup user_id if FE sent username
    // -------------------------------------------
    let user_id = body.user_id;
    if (!user_id && body.username) {
      const row = await sql`
        SELECT user_id FROM ssu_users WHERE username = ${body.username}
      `;
      if (row.length > 0) {
        user_id = row[0].user_id;
      }
    }

    // -------------------------------------------
    // Lookup action_user_id if FE sent actionUsername
    // -------------------------------------------
    let action_user_id = body.action_user_id;
    if (!action_user_id && body.actionUsername) {
      const row = await sql`
        SELECT user_id FROM ssu_users WHERE username = ${body.actionUsername}
      `;
      if (row.length > 0) {
        action_user_id = row[0].user_id;
      }
    }

    // -------------------------------------------
    // Validate required fields
    // -------------------------------------------
    if (!notification_type || !user_id) {
      return NextResponse.json(
        { success: false, message: "notification_type and user_id required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // -------------------------------------------
    // FIX: Convert undefined → NULL to prevent SQL errors
    // -------------------------------------------
    const safe_action_user_id = action_user_id ?? null;
    const safe_content = content ?? null;

    // -------------------------------------------
    // SQL Insert
    // -------------------------------------------
    const [row] = await sql`
      INSERT INTO notifications (
        notification_type,
        user_id,
        action_user_id,
        content,
        post_id
      )
      VALUES (
        ${notification_type},
        ${user_id},
        ${safe_action_user_id},
        ${safe_content},
        ${post_id}
      )
      RETURNING *
    `;

    return NextResponse.json(
      { success: true, notification: row },
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error("POST /notification error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/* =====================================================
   GET NOTIFICATIONS (GET)
   FE → GET /api/notification?username=test_user2
   ===================================================== */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { success: false, message: "username is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // lookup user_id
    const users = await sql`
      SELECT user_id FROM ssu_users WHERE username = ${username}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const userId = users[0].user_id;

    // fetch notifications
    const rows = await sql`
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

    // FE mapping
    const notifications = rows.map((n) => ({
      _id: n.notification_id,
      type: n.notification_type,
      text: n.content,
      isRead: n.is_read,
      postId: n.post_id,
      createdAt: n.created_at,
      actionUsername: n.action_username,
    }));

    return NextResponse.json(
      { success: true, notifications },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("GET /notification error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/* =====================================================
   UPDATE NOTIFICATION (PUT)
   FE → PUT /api/notification
   ===================================================== */
export async function PUT(req: Request) {
  try {
    const { id, isRead, text } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "notification id required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const patch: any = {};
    if (typeof isRead !== "undefined") patch.is_read = Boolean(isRead);
    if (typeof text !== "undefined") patch.content = text;

    const rows = await sql`
      UPDATE notifications
      SET ${sql(patch)}
      WHERE notification_id = ${id}::uuid
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, notification: rows[0] },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("PUT /notification error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/* =====================================================
   DELETE NOTIFICATION (DELETE)
   FE → DELETE /api/notification
   ===================================================== */
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "notification id required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const rows = await sql`
      DELETE FROM notifications
      WHERE notification_id = ${id}::uuid
      RETURNING notification_id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: "Notification deleted" },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("DELETE /notification error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
