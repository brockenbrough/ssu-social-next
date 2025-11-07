import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { message: "UserId is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const userExists = await sql`
      SELECT 1 FROM ssu_users WHERE user_id = ${userId}
    `;
    if (userExists.length === 0) {
      return NextResponse.json({ chatRooms: [] }, { headers: corsHeaders });
    }

    const rooms = await sql`
      SELECT chat_room_id, user_1, user_2, created_at
      FROM chatrooms
      WHERE user_1 = ${userId} OR user_2 = ${userId}
    `;

    const chatRooms = rooms.map((r) => ({
      _id: r.chat_room_id,
      participants: [
        { userId: r.user_1, firstMessageId: null },
        { userId: r.user_2, firstMessageId: null },
      ],
      date: r.created_at,
    }));

    return NextResponse.json({ chatRooms }, { headers: corsHeaders });
  } catch (err) {
    console.error("Error fetching chat rooms:", err);
    return NextResponse.json(
      { error: "Could not fetch chat rooms" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

 