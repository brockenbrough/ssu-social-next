import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://localhost:3000/api/statistics/likes");
    const data = await res.json();

    if (res.status === 200 && Array.isArray(data)) {
      const hasSeedLike = data.some(
        (l: any) =>
          l.userId === "22222222-2222-2222-2222-222222222222" &&
          l.postId === "33333333-3333-3333-3333-333333333333"
      );

      if (hasSeedLike) {
        return NextResponse.json({
          success: true,
          message: "Route returned expected 200 OK with seeded like.",
          data,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Route responded but did not contain expected seeded like.",
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