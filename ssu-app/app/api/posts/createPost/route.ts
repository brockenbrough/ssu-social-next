import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, content, imageUri, isSensitive, hasOffensiveText } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: userId or content" },
        { status: 400 }
      );
    }

    // Insert new post
    const inserted = await sql<{ post_id: string }[]>`
      INSERT INTO posts (
        user_id,
        content,
        image_uri,
        is_sensitive,
        has_offensive_text,
        created_at
      )
      VALUES (
        ${userId}::uuid,
        ${content},
        ${imageUri || null},
        ${isSensitive || false},
        ${hasOffensiveText || false},
        NOW()
      )
      RETURNING post_id, user_id, content, image_uri, is_sensitive, has_offensive_text, created_at
    `;

    return NextResponse.json({
      success: true,
      message: "Post created successfully",
      data: inserted[0],
    });
  } catch (err: any) {
    console.error("Create post error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
