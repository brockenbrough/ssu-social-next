import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Get Comment by Comment ID
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // Validate UUID format for comment id
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: "Invalid comment id" }, { status: 400 });
    }

    const rows = await sql`
      SELECT
        c.comment_id::text       AS "_id",
        c.user_id::text          AS "userId",
        u.username               AS "username",
        c.comment_content        AS "commentContent",
        c.created_at             AS "date",
        c.post_id::text          AS "postId"
      FROM comments c
      JOIN ssu_users u ON c.user_id = u.user_id
      WHERE c.comment_id = ${id}::uuid
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const comment = { ...rows[0], replies: [] }; // add replies array if you want

    return NextResponse.json(comment, { status: 200 });
  } catch (error) {
    console.error("Error fetching comment:", error);
    return NextResponse.json({ error: "Failed to fetch comment" }, { status: 500 });
  }
}

// Delete Comment by Comment ID

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: "Invalid comment id" }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM comments
      WHERE comment_id = ${id}::uuid
    `;

    if (result.count === 0) {
      return NextResponse.json({ error: "No comment" }, { status: 404 });
    }

    return NextResponse.json({ msg: "comment deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
