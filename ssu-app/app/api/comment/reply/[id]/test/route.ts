import { NextResponse } from "next/server";

// Test route: GET /api/tests/reply-to-comment
export async function GET() {
  try {
    const testPayload = {
      replyContent: "This is a test reply",
      userId: "11111111-1111-1111-1111-111111111111",
    };

    // Use an existing comment ID you want to test replying to
    const commentId = "22222222-2222-2222-2222-222222222222";

    const res = await fetch(`http://localhost:3000/api/comments/comment/reply/${commentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const data = await res.json();

    // Check if status is 200 OK and a message with replies is returned
    if (res.status === 200 && data?.message && Array.isArray(data.replies)) {
      // Optional: check if the replies array contains at least one reply with matching content
      const foundReply = data.replies.find(
        (r: any) => r.replyContent === testPayload.replyContent && r.userId === testPayload.userId
      );

      if (foundReply) {
        return NextResponse.json({
          success: true,
          message: "Reply was added successfully with expected data.",
          data: foundReply,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Reply added but expected reply data not found in response.",
            data,
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
