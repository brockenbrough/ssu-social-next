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

export async function GET(_request: Request, { params }: { params: { postId: string } }) {
  try {
    const { postId } = params;
    if (!postId) {
      return NextResponse.json({ commentnotfound: "No comment found" }, { status: 404 });
    }

    const rows = await sql<LegacyComment[]>`
      SELECT
        c.comment_id::text    AS _id,
        u.username            AS username,
        c.user_id::text       AS userId,
        c.comment_content     AS commentContent,
        c.created_at          AS date,
        c.post_id::text       AS postId
      FROM comments c
      JOIN ssu_users u ON u.user_id = c.user_id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC
    `;

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Error fetching comments by postId:", err);
    return NextResponse.json({ commentnotfound: "No comment found" }, { status: 404 });
  }
}