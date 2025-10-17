import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { postId, content } = body;

    if (!postId || !content) {
      return NextResponse.json(
        { error: "Missing required fields: postId or content" },
        { status: 400 }
      );
    }

    // Update the specific post
    const updated = await sql<{
      post_id: string;
      user_id: string;
      content: string;
    }[]>`
      UPDATE posts
      SET content = ${content}
      WHERE post_id = ${postId}::uuid
      RETURNING post_id, user_id, content;
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
      data: updated[0],
    });

  } catch (err: any) {
    console.error("Update post error:", err);
    return NextResponse.json(
      { error: "Failed to update post", details: err.message },
      { status: 500 }
    );
  }
}
