import { NextResponse } from "next/server";
import sql from "@/utilities/db";

export async function DELETE(req: Request) {
  try {
    // Accept JSON body or query params as fallback
    const url = new URL(req.url);
    const qsUser = url.searchParams.get("userId") ?? url.searchParams.get("user_id");
    const qsPost = url.searchParams.get("postId") ?? url.searchParams.get("post_id");

    let body: any = {};
    const text = await req.text().catch(() => "");
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text }; // keep raw text for debugging
      }
    }

    const userId = body.userId ?? body.user_id ?? qsUser;
    const postId = body.postId ?? body.post_id ?? qsPost;

    if (!userId || !postId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: userId and postId (or user_id/post_id)",
          received: { query: { userId: qsUser, postId: qsPost }, body },
        },
        { status: 400 }
      );
    }

    // Wrap query in try…catch for precise error handling
    let deleted;
    try {
      deleted = await sql<{ user_id: string; post_id: string }[]>`
        DELETE FROM likes
        WHERE user_id = ${userId} AND post_id = ${postId}
        RETURNING user_id::text AS user_id, post_id::text AS post_id
      `;
    } catch (queryErr) {
      console.error("Error running DELETE query:", queryErr);
      return NextResponse.json(
        { success: false, message: "Failed to delete like", detail: String(queryErr) },
        { status: 500 }
      );
    }

    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ success: false, message: "Like not found" }, { status: 404 });
    }

    return NextResponse.json(deleted[0], { status: 200 });
  } catch (err: any) {
    console.error("Error in unlike route:", err);
    return NextResponse.json(
      { success: false, message: "Failed to delete like", detail: String(err) },
      { status: 500 }
    );
  }
}
