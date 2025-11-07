import { NextResponse } from "next/server";
 

import sql from "@/utilities/db";

export async function GET() {
  try {
    const postId = "33333333-3333-3333-3333-333333333333"; // existing example post
    const userId = "11111111-1111-1111-1111-111111111111";
    const defaultContent = "Hello, this is a new post!";

    // Step 1: Check if post exists
    let post = await sql<{ post_id: string; content: string }[]>`
      SELECT post_id::text AS post_id, content
      FROM posts
      WHERE post_id = ${postId}::uuid;
    `;

    // Step 2: Create post if not exists
    if (post.length === 0) {
      const created = await sql<{ post_id: string; content: string }[]>`
        INSERT INTO posts (
          post_id,
          user_id,
          content,
          image_uri,
          is_sensitive,
          has_offensive_text,
          created_at
        )
        VALUES (
          ${postId}::uuid,
          ${userId}::uuid,
          ${defaultContent},
          NULL,
          FALSE,
          FALSE,
          NOW()
        )
        RETURNING post_id::text AS post_id, content;
      `;
      post = created;
    }

    // Step 3: Update the post content
    const updatedContent = "Updated content for unit test!";
    const updated = await sql<{ post_id: string; content: string }[]>`
      UPDATE posts
      SET content = ${updatedContent}
      WHERE post_id = ${postId}::uuid
      RETURNING post_id::text AS post_id, content;
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, message: "Post not found for update" },
        { status: 404 }
      );
    }

    // Step 4: Verify the update
    const verify = await sql<{ content: string }[]>`
      SELECT content FROM posts WHERE post_id = ${postId}::uuid;
    `;

    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
      data: {
        postId,
        oldContent: post[0].content,
        updatedContent: verify[0].content,
      },
    });
  } catch (err: any) {
    console.error("Update post unit test error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
