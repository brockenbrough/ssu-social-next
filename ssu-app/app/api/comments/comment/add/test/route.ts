// test for create a comment

import { NextResponse } from "next/server";

// POST /api/tests/create-comment
export async function GET() {
  try {
    const testPayload = {
      commentContent: "This is a test comment",
      postId: "33333333-3333-3333-3333-333333333333",
      userId: "11111111-1111-1111-1111-111111111111",
    };

    const res = await fetch("http://localhost:3000/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const data = await res.json();

    // Check if status is 201 Created
    if (res.status === 201 && data?.newComment) {
      const { newComment } = data;

      const hasAllFields =
        newComment._id &&
        newComment.commentContent === testPayload.commentContent &&
        newComment.postId === testPayload.postId &&
        newComment.userId === testPayload.userId &&
        typeof newComment.date === "string";

      if (hasAllFields) {
        return NextResponse.json({
          success: true,
          message: "Comment was created successfully with expected data.",
          data: newComment,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Comment created but missing or mismatching expected fields.",
            data: newComment,
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Unexpected status: ${res.status}`,
          data,
        },
        { status: res.status }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
