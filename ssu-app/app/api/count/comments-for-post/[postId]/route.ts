import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

// GET /api/comment/count/[postId]
// Returns the total number of comments for a given post
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await ctx.params;

    if (!postId) {
      return NextResponse.json(
        { message: "postId is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!/^[0-9a-fA-F-]{36}$/.test(postId)) {
      return NextResponse.json(
        { message: "Invalid post id" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if post exists (mirror behavior of like count route)
    const exists = await sql<{ exists: boolean }[]>`
      SELECT EXISTS(SELECT 1 FROM posts WHERE post_id = ${postId}::uuid) AS exists
    `;
    if (!exists?.[0]?.exists) {
      return NextResponse.json(
        { message: "Post does not exist." },
        { status: 404, headers: corsHeaders }
      );
    }

    // Count comments for this post
    const rows = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM comments
      WHERE post_id = ${postId}::uuid
    `;
    const commentCount = rows?.[0]?.count ?? 0;

    // Return only the number, just like the like count route
    return NextResponse.json(commentCount, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Error counting comments:", err);
    return NextResponse.json(
      { message: "Post does not exist." },
      { status: 404, headers: corsHeaders }
    );
  }
}
