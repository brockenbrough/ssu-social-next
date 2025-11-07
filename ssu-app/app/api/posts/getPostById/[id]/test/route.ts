import { NextResponse } from "next/server";
 

import sql from "@/utilities/db";

export async function GET() {
  try {
    const seededPostId = "33333333-3333-3333-3333-333333333333";

    const expected = {
      _id: seededPostId,
      userId: "11111111-1111-1111-1111-111111111111",
      content: "This is a fixed test post for automated test cases.",
      imageUri: null,
      isSensitive: false,
      hasOffensiveText: false,
    };

    // ✅ Direct DB query, no fetch
    const rows = await sql<{
      post_id: string;
      user_id: string;
      content: string;
      image_uri: string | null;
      is_sensitive: boolean;
      has_offensive_text: boolean;
    }[]>`
      SELECT *
      FROM posts
      WHERE post_id = ${seededPostId}::uuid
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Seeded post not found" }, { status: 404 });
    }

    const post = rows[0];

    const fieldsMismatch =
      post.post_id !== expected._id ||
      post.user_id !== expected.userId ||
      post.content !== expected.content ||
      post.image_uri !== expected.imageUri ||
      post.is_sensitive !== expected.isSensitive ||
      post.has_offensive_text !== expected.hasOffensiveText;

    if (fieldsMismatch) {
      return NextResponse.json({
        success: false,
        message: "Seeded post found but fields do not match expected values",
        data: { expected, found: post },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Seeded post retrieved successfully",
      data: {
        post: {
          _id: post.post_id,
          userId: post.user_id,
          content: post.content,
          imageUri: post.image_uri,
          isSensitive: post.is_sensitive,
          hasOffensiveText: post.has_offensive_text,
        },
      },
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
