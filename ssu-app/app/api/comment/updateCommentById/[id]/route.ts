// app/api/comment/updateCommentById/[id]/route.ts
import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";  //Just add this line 

export const runtime = "nodejs";
import sql from "@/utilities/db";

type LegacyComment = {
  _id: string;
  username: string | null;
  userId: string;
  commentContent: string;
  date: string | Date;
  postId: string;
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }   // <-- Promise here
) {
  try {
    const { id } = await ctx.params;         // <-- await params

    // UUID guard
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: "Invalid comment id" }, { status: 400, headers: corsHeaders });
    }

    // Parse body
    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders }); }

    const commentContent = (body as { commentContent?: unknown })?.commentContent;
    if (typeof commentContent !== "string" || commentContent.trim() === "") {
      return NextResponse.json(
        { error: "commentContent is required and must be a non-empty string" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Ensure the row exists (so 404 is true "not found")
    const pre = await sql`SELECT 1 FROM public.comments WHERE comment_id = ${id}::uuid`;
    if (pre.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404, headers: corsHeaders });
    }

    // Update + return legacy shape
    const rows = await sql<LegacyComment[]>`
      WITH updated AS (
        UPDATE public.comments
        SET comment_content = ${commentContent}
        WHERE comment_id = ${id}::uuid
        RETURNING comment_id, user_id, comment_content, created_at, post_id
      )
      SELECT
        u.comment_id::text               AS "_id",
        COALESCE(s.username, 'Unknown')  AS "username",
        u.user_id::text                  AS "userId",
        u.comment_content                AS "commentContent",
        u.created_at                     AS "date",
        u.post_id::text                  AS "postId"
      FROM updated u
      LEFT JOIN public.ssu_users s ON s.user_id = u.user_id
    `;

    return rows.length
      ? NextResponse.json({ ...rows[0], replies: [] as string[] }, { status: 200, headers: corsHeaders })
      : NextResponse.json({ error: "Update blocked" }, { status: 403, headers: corsHeaders });
  } catch (e) {
    console.error("Error updating comment by id:", e);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500, headers: corsHeaders });
  }
}
