import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";


// Create Postgres client
import sql from "@/utilities/db";

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

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

    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("GET all bookmarks error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500, headers: corsHeaders }
    );
  }
}
