// reply to comment

import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const parentCommentId = params.id; // the comment being replied to
    const { replyContent, userId } = await request.json();

    if (!parentCommentId || !replyContent || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch post_id of the comment being replied to
    const parentComment = await sql<{ post_id: string }[]>`
      SELECT post_id::text
      FROM comments
      WHERE comment_id = ${parentCommentId}
    `;

    if (parentComment.length === 0) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
    }

    const postId = parentComment[0].post_id;

    // Insert new comment as a "reply" linked to same post
    // Note: your table does NOT have parent_comment_id, so replies aren't tracked directly
    await sql`
      INSERT INTO comments (user_id, post_id, comment_content)
      VALUES (${userId}, ${postId}, ${replyContent})
    `;

    return NextResponse.json({ message: "Reply added as a new comment" }, { status: 200 });
  } catch (error) {
    console.error("Error adding reply:", error);
    return NextResponse.json({ error: "Failed to add reply" }, { status: 500 });
  }
}
