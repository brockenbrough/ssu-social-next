// app/api/notifications/deleteById/[id]/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";


export const runtime = "nodejs";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Та же простая проверка UUID, как в followers
const SIMPLE_UUID_RE = /^[0-9a-fA-F-]{36}$/;

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // Тот же способ получения параметров, как в followers
    const { id } = await ctx.params;

    if (!SIMPLE_UUID_RE.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification id" },
        { status: 400 }
      );
    }

    // Явный ::uuid чтобы не было конфликтов типов
    const rows = await sql/* sql */`
      DELETE FROM notifications
      WHERE notification_id = ${id}::uuid
      RETURNING notification_id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Notification deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting notification:", err);
    return NextResponse.json(
      { success: false, message: "Could not delete notification" },
      { status: 500 }
    );
  }
}
