import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

type LegacyMessage = {
  _id: string;          // maps to message_id
  chatRoomId: string;   // maps to chat_room_id
  senderId: string;     // maps to sender_id
  receiverId: string;   // maps to receiver_id
  text: string;         // maps to message_text
  isRead: boolean;      // maps to is_read
  date: string | Date;  // maps to created_at
};

export async function OPTIONS(_req: Request) {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await ctx.params;

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate UUID format (keeps behavior similar to your other Next route)
    if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
      return NextResponse.json(
        { message: "Invalid user id" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Mirror old behavior: 404 if user doesn't exist
    // Assumes a `users` table with a `user_id uuid` primary key.
    const userExists = await sql<{ exists: boolean }[]>`
      SELECT EXISTS(
        SELECT 1 FROM ssu_users WHERE user_id = ${userId}::uuid
      ) AS exists
    `;
    if (!userExists?.[0]?.exists) {
      return NextResponse.json(
        { message: `User with ID ${userId} not found.` },
        { status: 404, headers: corsHeaders }
      );
    }

    // Fetch messages for either sender or receiver, mapped to legacy keys
    const messages = await sql<LegacyMessage[]>`
      SELECT
        message_id::text       AS "_id",
        chat_room_id::text     AS "chatRoomId",
        sender_id::text        AS "senderId",
        receiver_id::text      AS "receiverId",
        message_text           AS "text",
        is_read                AS "isRead",
        created_at             AS "date"
      FROM messages
      WHERE sender_id = ${userId}::uuid
         OR receiver_id = ${userId}::uuid
      ORDER BY created_at ASC
    `;

    // Keep the exact old response shape: { data: messages }
    return NextResponse.json({ data: messages }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Error fetching messages:", err);
    return NextResponse.json(
      { error: "Could not fetch messages" },
      { status: 500, headers: corsHeaders }
    );
  }
}