// app/api/notifications/update/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

// Initialize PostgreSQL connection
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Define expected request body structure
type UpdateBody = {
  id?: string;
  text?: string;
  isRead?: boolean;
};

// Regular expression for UUID validation
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// PUT endpoint — update an existing notification
export async function PUT(req: Request) {
  try {
    // Parse request body safely
    const body = (await req.json().catch(() => ({}))) as UpdateBody;
    const { id, text, isRead } = body ?? {};

    //  Validate the provided notification ID
    if (!id) {
      return NextResponse.json(
        { message: "Notification ID is required." },
        { status: 400, headers: corsHeaders }
        { status: 400, headers: corsHeaders }
      );
    }
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { message: "Invalid notification ID format." },
        { status: 400, headers: corsHeaders }
        { status: 400, headers: corsHeaders }
      );
    }

    //  Build an update object (only include provided fields)
    const patch: Record<string, any> = {};
    if (typeof text !== "undefined") patch.content = String(text).trim();
    if (typeof isRead !== "undefined") patch.is_read = Boolean(isRead);

    // Reject empty update requests
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { message: "No updatable fields provided." },
        { status: 400, headers: corsHeaders }
        { status: 400, headers: corsHeaders }
      );
    }

    //  Verify that the notification exists before updating
    const [existing] = await sql`
      SELECT notification_id
      FROM notifications
      WHERE notification_id = ${id}::uuid
    `;
    if (!existing) {
      return NextResponse.json(
        { message: "Notification not found." },
        { status: 404, headers: corsHeaders }
        { status: 404, headers: corsHeaders }
      );
    }

    //  Perform the update and return the updated record
    const [updated] = await sql`
      UPDATE notifications
      SET ${sql(patch)}
      WHERE notification_id = ${id}::uuid
      RETURNING *
    `;

    return NextResponse.json(
      {
        message: "Notification updated successfully.",
        notification: updated,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    // Handle any runtime or SQL errors
    console.error("Error updating notification:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
