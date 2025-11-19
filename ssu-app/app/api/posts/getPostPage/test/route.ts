// app/api/posts/getpostpage/test/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "http://localhost:3000/api/posts/getPostPage?page=1&postPerPage=3"
    );
    const data = await res.json();

    if (res.ok && Array.isArray(data)) {
      return NextResponse.json({
        success: true,
        message: "✅ /api/posts/getpostpage returned posts successfully.",
        count: data.length,
        data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `❌ Unexpected response: status ${res.status}`,
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
