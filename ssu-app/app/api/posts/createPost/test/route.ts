import { NextResponse } from "next/server";
 

import sql from "@/utilities/db";

export async function GET() {
  try {
    // ✅ Use a valid user ID already in your seeded database
    const userId = "11111111-1111-1111-1111-111111111111";

    // Step 1: Create a new post
    const inserted = await sql<{
      post_id: string;
      content: string;
      user_id: string;
    }[]>`
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
        'Automated test post from createPost unit test',
        NULL,
        FALSE,
        FALSE,
        NOW()
      )
      RETURNING post_id, user_id, content;
    `;

    if (inserted.length === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to insert post" },
        { status: 500 }
      );
    }

    const postId = inserted[0].post_id;

    // Step 2: Verify post exists
    const verify = await sql<{ post_id: string }[]>`
      SELECT post_id FROM posts WHERE post_id = ${postId}::uuid;
    `;

    if (verify.length === 0) {
      return NextResponse.json(
        { success: false, message: "Post not found after creation" },
        { status: 500 }
      );
    }

    // ✅ Success
    return NextResponse.json({
      success: true,
      message: "Post created successfully",
      data: { postId },
    });

  } catch (err: any) {
    console.error("CREATE post unit test error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
