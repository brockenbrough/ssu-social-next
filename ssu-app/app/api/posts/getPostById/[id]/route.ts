import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type ApiPost = {
  _id: string;
  userId: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  createdAt: string | Date;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } // correctly inferred
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
  }

  try {
    const rows = await sql<ApiPost[]>`
      SELECT
        post_id::text        AS "_id",
        user_id::text        AS "userId",
        content              AS "content",
        image_uri            AS "imageUri",
        is_sensitive         AS "isSensitive",
        has_offensive_text   AS "hasOffensiveText",
        created_at           AS "createdAt"
      FROM posts
      WHERE post_id = ${id}::uuid
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: `Post with id ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch post", details: err.message }, { status: 500 });
  }
}
