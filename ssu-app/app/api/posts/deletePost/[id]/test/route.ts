import { NextResponse } from "next/server";
 

import sql from "@/utilities/db";

export async function GET() {
  try {
    // Seeded post ID from your schema/data seed
    const postId = "33333333-3333-3333-3333-333333333333";

    // Step 1: Attempt to delete the post
    const deleted = await sql<{ deleted: boolean }[]>`
      DELETE FROM posts
      WHERE post_id = ${postId}::uuid
      RETURNING TRUE AS deleted;
    `;

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, message: "Post not found or already deleted" },
        { status: 404 }
      );
    }

    // Step 2: Verify deletion
    const verify = await sql<{ post_id: string }[]>`
      SELECT post_id FROM posts WHERE post_id = ${postId}::uuid;
    `;

    if (verify.length > 0) {
      return NextResponse.json(
        { success: false, message: "Post still exists after deletion" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Seeded post deleted successfully",
      data: { postId },
    });

  } catch (err: any) {
    console.error("DELETE post unit test error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
