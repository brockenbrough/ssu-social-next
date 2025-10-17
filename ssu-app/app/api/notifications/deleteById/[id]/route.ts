// app/api/notifications/deleteById/[id]/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// (optional) UUID check to avoid cast errors
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const id = ctx.params?.id;

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required." },
        { status: 400 }
      );
    }
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: "Invalid notification ID format." },
        { status: 400 }
      );
    }

    const [deleted] = await sql/* sql */`
      DELETE FROM notifications
      WHERE notification_id = ${id}
      RETURNING notification_id
    `;

    if (!deleted) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { msg: "Notification deleted successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting notification:", err);
    return NextResponse.json(
      { error: "Could not delete notification." },
      { status: 500 }
    );
  }
}
