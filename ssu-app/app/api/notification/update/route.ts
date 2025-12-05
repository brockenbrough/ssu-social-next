// app/api/notification/route.ts
import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function PUT(req: Request) {
  try {
    const { id, isRead, text } = await req.json();

    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json(
        { message: "Invalid notification ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    const patch: any = {};
    if (typeof isRead !== "undefined") patch.is_read = Boolean(isRead);
    if (typeof text !== "undefined") patch.content = text.trim();

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { message: "No fields to update." },
        { status: 400, headers: corsHeaders }
      );
    }

    const existing = await sql`
      SELECT notification_id
      FROM notifications
      WHERE notification_id = ${id}::uuid
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { message: "Notification not found." },
        { status: 404, headers: corsHeaders }
      );
    }

    const [updated] = await sql`
      UPDATE notifications
      SET ${sql(patch)}
      WHERE notification_id = ${id}::uuid
      RETURNING *
    `;

    return NextResponse.json(
      { message: "Updated successfully", notification: updated },
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
