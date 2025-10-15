import { NextResponse } from "next/server";
import postgres from "postgres";

function connOptions() {
  return process.env.NODE_ENV === "production" ? { ssl: { rejectUnauthorized: false } } : {};
}

export async function GET(_req: Request, { params }: { params: { userId?: string } }) {
  const userId = params.userId;
  if (!userId) {
    return NextResponse.json({ success: false, message: "Missing userId path parameter" }, { status: 400 });
  }

  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";
  if (!connectionString) {
    return NextResponse.json({ success: false, message: "Missing POSTGRES_URL / DATABASE_URL" }, { status: 500 });
  }

  const sql = postgres(connectionString, connOptions());

  try {
    const rows = await sql`
      SELECT
        l.user_id::text   AS "userId",
        l.post_id::text   AS "postId",
        to_char(l.created_at, 'YYYY-MM-DD"T"HH24:MI:SSZ') AS "createdAt"
      FROM likes l
      WHERE l.user_id = ${userId}
      ORDER BY l.created_at DESC
    `;
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching likes for user:", userId, error);
    return NextResponse.json({ success: false, message: "Failed to fetch likes", detail: String(error) }, { status: 500 });
  } finally {
    try { await sql.end({ timeout: 1000 }); } catch {}
  }
}