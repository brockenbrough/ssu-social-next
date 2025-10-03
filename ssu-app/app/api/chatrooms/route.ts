import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type ApiChatRoom = {
    _id: string;
    participants: {
        userId: string;
        firstMessageId: string | null;
    }[];
    date: string | Date;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { participants } = body;

        if (!participants || !Array.isArray(participants) || participants.length !== 2) {
            return NextResponse.json(
                { message: "2 Participants are required." },
                { status: 400 }
            );
        }

        const [p1, p2] = participants;

        if (!p1.userId || !p2.userId) {
            return NextResponse.json(
                { message: "Participants must have userId." },
                { status: 400 }
            );
        }

        // Ensure users exist
        const users = await sql`
            SELECT user_id FROM ssu_users WHERE user_id IN (${p1.userId}, ${p2.userId})
        `;
        if (users.length !== 2) {
            return NextResponse.json(
                { message: "One or more users not found." },
                { status: 404 }
            );
        }

        // Check if chat room already exists for the unordered pair
        const existing = await sql`
            SELECT chat_room_id, user_1, user_2, created_at
            FROM chatrooms
            WHERE (user_1 = ${p1.userId} AND user_2 = ${p2.userId})
               OR (user_1 = ${p2.userId} AND user_2 = ${p1.userId})
        `;

        let chatRoomId: string;

        if (existing.length > 0) {
            chatRoomId = existing[0].chat_room_id;
        } else {
            const createdBy = p1.userId; // creator can default to first participant
            const created = await sql`
                INSERT INTO chatrooms (user_1, user_2, created_by)
                VALUES (${p1.userId}, ${p2.userId}, ${createdBy})
                RETURNING chat_room_id, created_at
            `;
            chatRoomId = created[0].chat_room_id as string;
        }

        // Compose response in the mongoose-like shape the legacy API used
        const apiResponse: ApiChatRoom = {
            _id: chatRoomId,
            participants: [
                { userId: p1.userId, firstMessageId: p1.firstMessageId ?? null },
                { userId: p2.userId, firstMessageId: p2.firstMessageId ?? null },
            ],
            date: new Date().toISOString(),
        };

        return NextResponse.json(
            { message: existing.length > 0 ? "Chat room already exists" : "Chat room created successfully", chatRoom: apiResponse },
            { status: existing.length > 0 ? 200 : 201 }
        );
    } catch (error) {
        console.error("Error creating chat room:", error);
        return NextResponse.json(
            { error: "Could not create chat room" },
            { status: 500 }
        );
    }
}


