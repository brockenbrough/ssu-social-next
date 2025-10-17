import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Expected fixed test post from schema_load.sql
    const expectedPost = {
      _id: "33333333-3333-3333-3333-333333333333",
      userId: "11111111-1111-1111-1111-111111111111",
      content: "This is a fixed test post for automated test cases.",
      imageUri: null,
      isSensitive: false,
      hasOffensiveText: false,
    };

    // Call the posts route being tested
    const res = await fetch("http://localhost:3000/api/posts/getAllPosts");
    const data = await res.json();

    // Check status code and that we got an array
    if (res.status === 200 && Array.isArray(data)) {
      // Look for the fixed seeded post
      const found = data.find(
        (p: any) =>
          p._id === expectedPost._id &&
          p.userId === expectedPost.userId &&
          p.content === expectedPost.content &&
          p.imageUri === expectedPost.imageUri &&
          p.isSensitive === expectedPost.isSensitive &&
          p.hasOffensiveText === expectedPost.hasOffensiveText
      );

      if (found) {
        return NextResponse.json({
          success: true,
          message: "Route returned expected 200 OK with seeded post.",
          data,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message:
              "Route responded but did not contain the expected seeded post.",
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
