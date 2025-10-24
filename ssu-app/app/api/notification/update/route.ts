// app/api/notifications/update/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";


const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type UpdateBody = {
  id?: string;
  text?: string;
  isRead?: boolean;
};

// UUID validation regex (accepts hyphenated IDs)
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function PUT(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as UpdateBody;
    const { id, text, isRead } = body ?? {};

    //  Validate ID
    if (!id) {
      return NextResponse.json(
        { message: "Notification ID is required." },
        { status: 400 }
      );
    }
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { message: "Invalid notification ID format." },
        { status: 400 }
      );
    }

    //  Prepare fields to update
    const patch: Record<string, any> = {};
    if (typeof text !== "undefined") patch.content = String(text).trim();
    if (typeof isRead !== "undefined") patch.is_read = Boolean(isRead);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { message: "No updatable fields provided." },
        { status: 400 }
      );
    }

    //  Check if notification exists
    const [existing] = await sql`
      SELECT notification_id
      FROM notifications
      WHERE notification_id = ${id}
    `;

    if (!existing) {
      return NextResponse.json(
        { message: "Notification not found." },
        { status: 404 }
      );
    }

    //  Perform update and return updated row
    const [updated] = await sql`
      UPDATE notifications
      SET ${sql(patch)}
      WHERE notification_id = ${id}
      RETURNING *
    `;

    return NextResponse.json(
      {
        message: "Notification updated successfully.",
        notification: updated,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating notification:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
