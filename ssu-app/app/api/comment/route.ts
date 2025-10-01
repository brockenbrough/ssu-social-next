import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type ApiComment = {
  _id: string;
  username: string;        // will be empty string
  userId: string;
  commentContent: string;
  replies: string[];       // empty array
  date: string | Date;
  postId: string;
};

export async function GET() {
  try {
    const rows = await sql<ApiComment[]>`
      SELECT
        comment_id::text         AS "_id",
        ''                       AS "username",
        user_id::text            AS "userId",
        comment_content          AS "commentContent",
        created_at               AS "date",
        post_id::text            AS "postId"
      FROM comments
      ORDER BY created_at DESC
    `;

    const data = rows.map(comment => ({
      ...comment,
      replies: [],
    }));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
