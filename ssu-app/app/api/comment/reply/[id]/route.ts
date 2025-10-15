// reply to comment

import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parentCommentId } = await ctx.params;

    // Validate UUID format for comment id
    if (!/^[0-9a-fA-F-]{36}$/.test(parentCommentId)) {
      return NextResponse.json({ error: "Invalid comment id" }, { status: 400 });
    }

    const { replyContent, userId } = await request.json();

    if (!replyContent || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch post_id of the comment being replied to
    const parentComment = await sql<{ post_id: string }[]>`
      SELECT post_id::text
      FROM comments
      WHERE comment_id = ${parentCommentId}::uuid
    `;

    if (parentComment.length === 0) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
    }

    const postId = parentComment[0].post_id;

    // Insert new comment as a "reply" linked to same post
    await sql`
      INSERT INTO comments (user_id, post_id, comment_content)
      VALUES (${userId}::uuid, ${postId}::uuid, ${replyContent})
    `;

    return NextResponse.json({ message: "Reply added as a new comment" }, { status: 200 });
  } catch (error) {
    console.error("Error adding reply:", error);
    return NextResponse.json({ error: "Failed to add reply" }, { status: 500 });
  }
}
