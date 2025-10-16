// app/api/posts/getpostpagebyusername/test/route.ts
import { NextResponse } from "next/server";

const TEST_USERNAME = "test_user1";

export async function GET() {
  try {
    const res = await fetch(
      `http://localhost:3000/api/posts/getpostpagebyusername?username=${TEST_USERNAME}&page=1&postPerPage=3`
    );

    const data = await res.json();

    if (res.status === 200 && Array.isArray(data.data)) {
      return NextResponse.json({
        success: true,
        message: `✅ /api/posts/getpostpagebyusername works correctly for ${TEST_USERNAME}.`,
        count: data.data.length,
        data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `❌ Unexpected response from /getpostpagebyusername (status ${res.status})`,
          data,
        },
        { status: res.status }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message ?? "Unhandled error" },
      { status: 500 }
    );
  }
}
