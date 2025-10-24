import { NextResponse } from "next/server";
import postgres from "postgres";

export const runtime = "nodejs";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type LegacyComment = {
  _id: string;
  username: string;
  userId: string;
  commentContent: string;
  replies?: string[];
  date: string | Date;
  postId: string;
};

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

// GET /api/comment/postId/[postId]
// Returns all comments for a given post in legacy shape
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await ctx.params;

    // Optional UUID validation (mirrors user/[id] style)
    if (!/^[0-9a-fA-F-]{36}$/.test(postId)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }

    const rows = await sql<LegacyComment[]>`
      SELECT
        c.comment_id::text    AS "_id",
        u.username            AS "username",
        c.user_id::text       AS "userId",
        c.comment_content     AS "commentContent",
        c.created_at          AS "date",
        c.post_id::text       AS "postId"
      FROM comments c
      JOIN ssu_users u ON u.user_id = c.user_id
      WHERE c.post_id = ${postId}::uuid
      ORDER BY c.created_at ASC
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments by postId:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}


