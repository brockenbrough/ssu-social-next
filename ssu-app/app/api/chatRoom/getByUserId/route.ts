import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ message: "UserId is required." }, { status: 400, headers: corsHeaders });
        }

        // Verify user exists; if missing, return empty list for compatibility
        const userExists = await sql`
            SELECT 1 FROM ssu_users WHERE user_id = ${userId}
        `;
        if (userExists.length === 0) {
            return NextResponse.json({ chatRooms: [] }, { headers: corsHeaders });
        }

        // Find chatrooms where user participates
        const rooms = await sql`
            SELECT chat_room_id, user_1, user_2, created_at
            FROM chatrooms
            WHERE user_1 = ${userId} OR user_2 = ${userId}
        `;

        // Return in a shape roughly compatible with legacy API
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
        return NextResponse.json({ error: "Could not fetch chat rooms" }, { status: 500, headers: corsHeaders });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
}


