// WARNING
//"we are fairly certain that this code isn't used, because it's the wrong location, the URI path does not match the front end"
import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "Missing postId query parameter" },
        { status: 400, headers: corsHeaders }
      );
    }

    const rows = await sql`
      SELECT
        post_id::text AS "_id",
        user_id::text AS "userId",
        content,
        image_uri AS "imageUri",
        is_sensitive AS "isSensitive",
        has_offensive_text AS "hasOffensiveText",
        created_at AS "createdAt"
      FROM posts
      WHERE post_id = ${postId}::uuid
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err: any) {
    console.error("Error fetching post:", err);
    return NextResponse.json(
      { success: false, message: "Error fetching post" },
      { status: 500, headers: corsHeaders }
    );
  }
}
