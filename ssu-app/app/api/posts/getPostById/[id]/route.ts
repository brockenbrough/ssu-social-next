import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

type ApiPost = {
  _id: string;
  userId: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  createdAt: string | Date;
};

// GET /api/post/[id]
export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    // Validate UUID
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post id" }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch only the post
    const rows = await sql<ApiPost[]>`
SELECT
  p.post_id::text AS "_id",
  p.user_id::text AS "userId",
  u.username      AS "username",
  p.content       AS "content",
  p.image_uri     AS "imageUri",
  p.is_sensitive  AS "isSensitive",
  p.has_offensive_text AS "hasOffensiveText",
  p.created_at    AS "date"
FROM posts p
JOIN ssu_users u ON u.user_id = p.user_id
WHERE p.post_id = ${id}::uuid
LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0], 
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch posts" },
      { status: 500, headers: corsHeaders }
    );
  }
}
