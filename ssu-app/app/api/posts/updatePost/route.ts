import { NextResponse } from "next/server";
import postgres from "postgres";

// Connect to Postgres
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

// PATCH /api/posts/updatePost
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { postId, content } = body;

    // Validate required fields
    if (!postId || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Invalid request. 'postId' and 'content' are required." },
        { status: 400 }
      );
    }

    // Check if post exists first (optional but safer)
    const existing = await sql`
      SELECT post_id FROM posts WHERE post_id = ${postId} LIMIT 1;
    `;
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Post not found." },
        { status: 404 }
      );
    }

    // Update post content
    const updated = await sql<ApiPost[]>`
      UPDATE posts
      SET 
        content = ${content},
        created_at = NOW()  -- optional: refresh timestamp
      WHERE post_id = ${postId}
      RETURNING
        post_id::text        AS "_id",
        user_id::text        AS "userId",
        content              AS "content",
        image_uri            AS "imageUri",
        is_sensitive         AS "isSensitive",
        has_offensive_text   AS "hasOffensiveText",
        created_at           AS "createdAt";
    `;

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post." },
      { status: 500 }
    );
  }
}
