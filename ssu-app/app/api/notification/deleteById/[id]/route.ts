// app/api/notifications/deleteById/[id]/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

// Explicitly specify the runtime
export const runtime = "nodejs";

// Initialize PostgreSQL connection
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Simple UUID validation pattern
const SIMPLE_UUID_RE = /^[0-9a-fA-F-]{36}$/;

// DELETE route handler
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // Extract the "id" parameter from the request context
    const { id } = await ctx.params;

    // Validate UUID format
    if (!SIMPLE_UUID_RE.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification id" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Execute SQL DELETE query with explicit UUID casting
    const rows = await sql/* sql */`
      DELETE FROM notifications
      WHERE notification_id = ${id}::uuid
      RETURNING notification_id
    `;

    // Handle case when no rows are affected (notification not found)
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404, headers: corsHeaders }
        { status: 404, headers: corsHeaders }
      );
    }

    // Successful deletion response
    return NextResponse.json(
      { success: true, message: "Notification deleted successfully" },
      { status: 200, headers: corsHeaders }
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    // Log the error and return a server error response
    console.error("Error deleting notification:", err);
    return NextResponse.json(
      { success: false, message: "Could not delete notification" },
      { status: 500, headers: corsHeaders }
      { status: 500, headers: corsHeaders }
    );
  }
}
