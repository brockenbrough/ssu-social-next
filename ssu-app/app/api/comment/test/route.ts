import { NextResponse } from "next/server";
// Get all comments test
export async function GET() {
  try {
    const res = await fetch("http://localhost:3000/api/comment");
    const data = await res.json();

    if (res.status === 200 && Array.isArray(data)) {
      // Define expected postIds and usernames
      const expectedPostIds = [
        "33333333-3333-3333-3333-333333333333",
      ];

      const expectedUsernames = [
        "test_user1",
        "test_user2",
      ];

      // Check if all expected postIds exist in at least one comment
      const hasAllPostIds = expectedPostIds.every((postId) =>
        data.some((comment: any) => comment.postId === postId)
      );

      // Check if all expected usernames exist in at least one comment
      const hasAllUsernames = expectedUsernames.every((username) =>
        data.some((comment: any) => comment.username === username)
      );

      if (hasAllPostIds && hasAllUsernames) {
        return NextResponse.json({
          success: true,
          message: "Route returned expected 200 OK with matching postIds and usernames.",
          data,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Route responded but did not contain all expected postIds and usernames.",
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
