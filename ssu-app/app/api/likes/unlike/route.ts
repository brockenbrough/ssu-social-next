import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";


function connOptions() {
  return process.env.NODE_ENV === "production" ? { ssl: { rejectUnauthorized: false } } : {};
}

export async function DELETE(req: Request) {
  try {
    // accept JSON body or query params as fallback
    const url = new URL(req.url);
    const qsUser = url.searchParams.get("userId") ?? url.searchParams.get("user_id");
    const qsPost = url.searchParams.get("postId") ?? url.searchParams.get("post_id");

    // try to parse body (may be empty for some clients)
    let body: any = {};
    const text = await req.text().catch(() => "");
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        // keep raw text in body.raw for debugging
        body = { raw: text };
      }
    }

    const userId = body.userId ?? body.user_id ?? qsUser;
    const postId = body.postId ?? body.post_id ?? qsPost;

    if (!userId || !postId) {
      // include what we received to help debugging
      return NextResponse.json(
        { success: false, message: "Missing required fields: userId and postId (or user_id/post_id)", received: { query: { userId: qsUser, postId: qsPost }, body } },
        { status: 400 }
      );
    }

    const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";
    if (!connectionString) {
      return NextResponse.json({ success: false, message: "Missing POSTGRES_URL / DATABASE_URL" }, { status: 500 });
    }

    const sql = postgres(connectionString, connOptions());

    try {
      const deleted = await sql<{ user_id: string; post_id: string }[]>`
        DELETE FROM likes
        WHERE user_id = ${userId} AND post_id = ${postId}
        RETURNING user_id::text AS user_id, post_id::text AS post_id
      `;

      if (!deleted || deleted.length === 0) {
        return NextResponse.json({ success: false, message: "Like not found" }, { status: 404 });
      }

      return NextResponse.json(deleted[0], { status: 200, headers: corsHeaders });
    } finally {
      try { await sql.end({ timeout: 1000 }); } catch {}
    }
  } catch (err: any) {
    console.error("Error in unlike route:", err);
    return NextResponse.json({ success: false, message: "Failed to delete like", detail: String(err) }, { status: 500 });
  }
}
