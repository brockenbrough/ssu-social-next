// app/api/notifications/deleteById/[id]/route.ts
import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

export const runtime = "nodejs";

import sql from "@/utilities/db";

// Simple UUID validation
const SIMPLE_UUID_RE = /^[0-9a-fA-F-]{36}$/;


// Handle preflight CORS requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}


export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!SIMPLE_UUID_RE.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Explicit ::uuid to avoid type conflicts
    const rows = await sql/* sql */`
      DELETE FROM notifications
      WHERE notification_id = ${id}::uuid
      RETURNING notification_id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: "Notification deleted successfully" },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Error deleting notification:", err);
    return NextResponse.json(
      { success: false, message: "Could not delete notification" },
      { status: 500, headers: corsHeaders }
    );
  }
}
