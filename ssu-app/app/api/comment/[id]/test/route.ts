import { NextResponse } from "next/server";

const BASE_URL = "http://localhost:3000/api/comment";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId || !/^[0-9a-fA-F-]{36}$/.test(commentId)) {
      return NextResponse.json({ success: false, message: "Invalid or missing commentId" }, { status: 400 });
    }

    const res = await fetch(`${BASE_URL}/${commentId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();

    if (res.ok) {
      return NextResponse.json({
        success: true,
        message: `GET /api/comment/${commentId} returned successfully.`,
        data,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `GET /api/comment/${commentId} failed with status ${res.status}.`,
        data,
      }, { status: res.status });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId || !/^[0-9a-fA-F-]{36}$/.test(commentId)) {
      return NextResponse.json({ success: false, message: "Invalid or missing commentId" }, { status: 400 });
    }

    const res = await fetch(`${BASE_URL}/${commentId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();

    if (res.ok) {
      return NextResponse.json({
        success: true,
        message: `DELETE /api/comment/${commentId} succeeded.`,
        data,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `DELETE /api/comment/${commentId} failed with status ${res.status}.`,
        data,
      }, { status: res.status });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
