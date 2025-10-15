// app/api/Posts/GetPostPage/test/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://localhost:3000/api/posts/GetPostPage?page=1&postPerPage=3");
    const data = await res.json();

    if (res.status === 200 && Array.isArray(data.data)) {
      return NextResponse.json({
        success: true,
        message: "✅ /api/posts/GetPostPage returned posts successfully.",
        count: data.data.length,
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
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
