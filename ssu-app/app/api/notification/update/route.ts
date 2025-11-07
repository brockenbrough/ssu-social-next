// app/api/notifications/update/route.ts
import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

export const runtime = "nodejs"; // required for 'postgres' client

import sql from "@/utilities/db";

type UpdateBody = {
  id?: string;
  text?: string;
  isRead?: boolean;
};

// UUID validation (hyphenated)
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as UpdateBody;
    const { id, text, isRead } = body ?? {};

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { message: "Notification ID is required." },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { message: "Invalid notification ID format." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Build patch
    const patch: Record<string, any> = {};
    if (typeof text !== "undefined") patch.content = String(text).trim();
    if (typeof isRead !== "undefined") patch.is_read = Boolean(isRead);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { message: "No updatable fields provided." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Exists?
    const [existing] = await sql/* sql */`
      SELECT notification_id
      FROM notifications
      WHERE notification_id = ${id}::uuid
    `;
    if (!existing) {
      return NextResponse.json(
        { message: "Notification not found." },
        { status: 404, headers: corsHeaders }
      );
    }

    // Update
    const [updated] = await sql/* sql */`
      UPDATE notifications
      SET ${sql(patch)}
      WHERE notification_id = ${id}::uuid
      RETURNING *
    `;

    return NextResponse.json(
      { message: "Notification updated successfully.", notification: updated },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Error updating notification:", err);
    return NextResponse.json(
      { message: "Server error", error: err?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
