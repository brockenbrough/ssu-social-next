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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const postId = searchParams.get("post_id");
    const isPublicParam = searchParams.get("is_public");

    const rows = await sql`
      SELECT b.bookmark_id, b.user_id, b.post_id, b.created_at, b.is_public,
             p.content AS post_content, u.username AS author
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.post_id
      JOIN ssu_users u ON p.user_id = u.user_id
      WHERE 1=1
      ${userId ? sql` AND b.user_id = ${userId}` : sql``}
      ${postId ? sql` AND b.post_id = ${postId}` : sql``}
      ${isPublicParam !== null ? sql` AND b.is_public = ${isPublicParam === "true"}` : sql``}
      ORDER BY b.created_at DESC
    `;

    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("GET bookmarks (manage) error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { user_id: userId, post_id: postId, is_public: isPublic } = body ?? {};

    if (!userId || !postId) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, post_id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const rows = await sql`
      INSERT INTO bookmarks (user_id, post_id, is_public)
      VALUES (${userId}, ${postId}, ${isPublic ?? true})
      ON CONFLICT (user_id, post_id) DO NOTHING
      RETURNING bookmark_id, user_id, post_id, created_at, is_public
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Bookmark already exists for this user and post" },
        { status: 409 }
      );
    }

    const [created] = rows as any[];

    const details = await sql`
      SELECT b.bookmark_id, b.user_id, b.post_id, b.created_at, b.is_public,
             p.content AS post_content, u.username AS author
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.post_id
      JOIN ssu_users u ON p.user_id = u.user_id
      WHERE b.bookmark_id = ${created.bookmark_id}
    `;

    return NextResponse.json(details[0], { status: 201, headers: corsHeaders });
  } catch (err) {
    console.error("POST bookmark (manage) error:", err);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { bookmark_id: bookmarkId, user_id: userId, post_id: postId } = body ?? {};

    if (!bookmarkId && !(userId && postId)) {
      return NextResponse.json(
        { error: "Provide bookmark_id or both user_id and post_id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await sql`
      DELETE FROM bookmarks
      WHERE ${bookmarkId ? sql`bookmark_id = ${bookmarkId}` : sql`user_id = ${userId} AND post_id = ${postId}`}
      RETURNING bookmark_id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { deleted: result.length },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("DELETE bookmark (manage) error:", err);
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500, headers: corsHeaders }
    );
  }
}



