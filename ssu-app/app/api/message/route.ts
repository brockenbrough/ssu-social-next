import { NextResponse } from "next/server";
 
import { auth } from "@/app/lib/auth";
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Type matching the original API response format (using mongoose field names)
type ApiMessage = {
    _id: string;
    chatRoomId: string;
    senderId: string;
    receiverId: string;
    text: string;
    isRead: boolean;
    date: string | Date;
};

export async function OPTIONS(_req: Request) {
    return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        // TODO: Re-enable auth after migration is complete
        /*
        // Verify authentication
        const session = await auth();
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized. Please log in." },
                { status: 401, headers: corsHeaders }
            );
        }
        */

        // Parse request body
        const body = await request.json();
        const { chatRoomId, senderId, receiverId, text, isRead } = body;

        // TODO: Re-enable sender verification after migration
        /*
        if (session.user.id !== senderId) {
                 return NextResponse.json(
                     { error: "Forbidden. You can only send messages as yourself." },
                     { status: 403, headers: corsHeaders }
                 );
        }
        */

        // Validate required fields
        if (!chatRoomId || !senderId || !receiverId || !text) {
            return NextResponse.json(
                {
                    message: "chatRoomId, senderId, receiverId and text are required.",
                },
                { status: 400, headers: corsHeaders }
            );
        }

        // Validate text is not empty after trimming
        if (text.trim() === "") {
            return NextResponse.json(
                { message: "Text is required." },
                { status: 400, headers: corsHeaders }
            );
        }

        // Check if chat room exists
        const chatRoomExists = await sql`
            SELECT 1 FROM chatrooms WHERE chat_room_id = ${chatRoomId}
        `;
        if (chatRoomExists.length === 0) {
            return NextResponse.json(
                { message: `Chat room with ID ${chatRoomId} not found.` },
                { status: 404, headers: corsHeaders }
            );
        }

        // Check if sender exists
        const senderExists = await sql`
            SELECT 1 FROM ssu_users WHERE user_id = ${senderId}
        `;
        if (senderExists.length === 0) {
            return NextResponse.json(
                { message: `Sender with ID ${senderId} not found.` },
                { status: 404, headers: corsHeaders }
            );
        }

        // Check if receiver exists
        const receiverExists = await sql`
            SELECT 1 FROM ssu_users WHERE user_id = ${receiverId}
        `;
        if (receiverExists.length === 0) {
            return NextResponse.json(
                { message: `Receiver with ID ${receiverId} not found.` },
                { status: 404, headers: corsHeaders }
            );
        }

        // Insert the message and return fields matching the original API
        const result = await sql<ApiMessage[]>`
            INSERT INTO messages (
                chat_room_id,
                sender_id,
                receiver_id,
                message_text,
                is_read
            ) VALUES (
                ${chatRoomId},
                ${senderId},
                ${receiverId},
                ${text},
                ${isRead ?? false}
            )
            RETURNING
                message_id::text AS "_id",
                chat_room_id::text AS "chatRoomId",
                sender_id::text AS "senderId",
                receiver_id::text AS "receiverId",
                message_text AS "text",
                is_read AS "isRead",
                created_at AS "date"
        `;

        const newMessage = result[0];

        return NextResponse.json(
            {
                message: "Message created successfully",
                data: newMessage,
            },
            { status: 201, headers: corsHeaders }
        );
    } catch (error) {
        console.error("Error creating message:", error);
        return NextResponse.json(
            { error: "Could not create message" },
            { status: 500, headers: corsHeaders }
        );
    }
}