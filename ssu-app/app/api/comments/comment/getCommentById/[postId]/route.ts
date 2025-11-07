import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

export const runtime = "nodejs";

import sql from "@/utilities/db";

type LegacyReply = {
  _id: string;
  content: string;
};

type LegacyComment = {
  _id: string;
  username: string;
  userId: string;
  commentContent: string;
  replies?: LegacyReply[];
  date: string | Date;
  postId: string;
  key?: string;
};

// GET /api/comments/getCommentById/[postId]
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await ctx.params;

    if (!/^[0-9a-fA-F-]{36}$/.test(postId)) {
      return NextResponse.json(
        { error: "Invalid post id" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch comments from database
    const rows = await sql<LegacyComment[]>`
      SELECT
        COALESCE(c.comment_id::text, gen_random_uuid()::text) AS "_id",
        u.username AS "username",
        c.user_id::text AS "userId",
        c.comment_content AS "commentContent",
        c.created_at AS "date",
        c.post_id::text AS "postId"
      FROM comments c
      JOIN ssu_users u ON u.user_id = c.user_id
      WHERE c.post_id = ${postId}::uuid
      ORDER BY c.created_at ASC
    `;

    // Add unique key for each comment
    const commentsWithKey = rows.map(comment => ({
      ...comment,
      key: comment._id,
      replies: [], // safe default
    }));

    return NextResponse.json(commentsWithKey, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching comments by postId:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500, headers: corsHeaders }
    );
  }
}
