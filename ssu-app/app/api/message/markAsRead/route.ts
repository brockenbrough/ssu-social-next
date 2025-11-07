import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Body shape from old backend
type MarkAsReadBody = {
  messageIds?: string[];
};

// Loosen UUID validation to accept seeded IDs (hyphenated hex)
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function OPTIONS(_req: Request) {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function PUT(req: Request) {
  try {
    // Parse JSON body
    const body = (await req.json().catch(() => ({}))) as MarkAsReadBody;
    const { messageIds } = body ?? {};

    // Mirror old behavior: require an array in the payload
    if (!Array.isArray(messageIds)) {
      return NextResponse.json(
        { message: "Message IDs are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Old route returns 200 with success message if empty list
    if (messageIds.length === 0) {
      return NextResponse.json(
        { message: "Messages are marked as read successfully." },
        { status: 200, headers: corsHeaders }
      );
    }

    // Filter to valid UUIDs; ignore any malformed ids to avoid cast errors.
    const validIds = messageIds.filter((id) => typeof id === "string" && UUID_RE.test(id));

    // If nothing valid remains, behave like "no messages found"
    if (validIds.length === 0) {
      return NextResponse.json({ message: "No messages found" }, { status: 404, headers: corsHeaders });
    }

    // Check which of these actually exist (old route did a find() first)
    const found = await sql<{ message_id: string }[]>`
      SELECT message_id::text AS message_id
      FROM messages
      WHERE message_id IN ${sql(validIds)}
    `;

    if (found.length === 0) {
      return NextResponse.json({ message: "No messages found" }, { status: 404, headers: corsHeaders });
    }

    // Update only the ones that exist; mirror old updateMany
    await sql`
      UPDATE messages
      SET is_read = TRUE
      WHERE message_id IN ${sql(found.map((r) => r.message_id))}
    `;

    // Keep the exact success text
    return NextResponse.json(
      { message: "Messages are marked as read successfully." },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Error marking messages as read:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500, headers: corsHeaders });
  }
}