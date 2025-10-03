import { NextResponse } from "next/server";
import postgres from "postgres";


// Create Postgres client
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(req: Request) {
  try {
    // Fetch all bookmarks along with post content and author username
    const rows = await sql`
      SELECT b.bookmark_id, b.user_id, b.post_id, b.created_at, b.is_public,
             p.content AS post_content, u.username AS author
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.post_id
      JOIN ssu_users u ON p.user_id = u.user_id
      ORDER BY b.created_at DESC
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error("GET all bookmarks error:", err);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}
