import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type ApiComment = {
  _id: string;
  userId: string;
  username: string;
  commentContent: string;
  replies: string[];
  date: string | Date;
  postId: string;
};

export async function GET() {
  try {
    const rows = await sql<ApiComment[]>`
      SELECT
        c.comment_id::text        AS "_id",
        c.user_id::text           AS "userId",
        u.username              AS "username",
        c.comment_content         AS "commentContent",
        c.created_at              AS "date",
        c.post_id::text           AS "postId"
      FROM comments c
      JOIN ssu_users u ON c.user_id = u.user_id
      ORDER BY c.created_at DESC
    `;

    const data = rows.map(c => ({
      ...c,
      replies: [],
    }));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
