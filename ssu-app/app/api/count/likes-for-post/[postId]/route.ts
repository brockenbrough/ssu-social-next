import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await ctx.params;

    if (!postId) {
      return NextResponse.json({ message: "postId is required." }, { status: 400, headers: corsHeaders });
    }

    if (!/^[0-9a-fA-F-]{36}$/.test(postId)) {
      return NextResponse.json({ message: "Invalid post id" }, { status: 400, headers: corsHeaders });
    }

    // Mirror old behavior: 404 if post doesn't exist
    const exists = await sql<{ exists: boolean }[]>`
      SELECT EXISTS(SELECT 1 FROM posts WHERE post_id = ${postId}::uuid) AS exists
    `;
    if (!exists?.[0]?.exists) {
      return NextResponse.json({ message: "Post does not exist." }, { status: 404, headers: corsHeaders });
    }

    // Count likes for this post
    const rows = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM likes
      WHERE post_id = ${postId}::uuid
    `;
    const likeCount = rows?.[0]?.count ?? 0;

    // Keep the exact old response shape: just a number (not { count: n })
    return NextResponse.json(likeCount, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Error counting likes:", err);
    // Old route returned 404 with this message on errors, so preserve that
    return NextResponse.json({ message: "Post does not exist." }, { status: 404, headers: corsHeaders });
  }
}