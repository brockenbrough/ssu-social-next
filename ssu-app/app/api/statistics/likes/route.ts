import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type ApiLike = {
  userId: string;
  postId: string;
  date: string | Date;
};

export async function GET() {
  try {
    const rows = await sql<ApiLike[]>`
      SELECT
        l.user_id::text           AS "userId",
        l.post_id::text           AS "postId",
        l.created_at              AS "date"
      FROM likes l
      ORDER BY l.created_at DESC
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
