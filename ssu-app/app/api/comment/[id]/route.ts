import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";  //Just add this line 

import sql from "@/utilities/db";

// Get Comment by Comment ID
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // Validate UUID format for comment id
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: "Invalid comment id" }, { status: 400, headers: corsHeaders });
    }

    const rows = await sql`
      SELECT
        c.comment_id::text       AS "_id",
        c.user_id::text          AS "userId",
        u.username               AS "username",
        c.comment_content        AS "commentContent",
        c.created_at             AS "date",
        c.post_id::text          AS "postId"
      FROM comments c
      JOIN ssu_users u ON c.user_id = u.user_id
      WHERE c.comment_id = ${id}::uuid
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404, headers: corsHeaders });
    }

    const comment = { ...rows[0], replies: [] }; // add replies array if you want

    return NextResponse.json(comment, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching comment:", error);
    return NextResponse.json({ error: "Failed to fetch comment" }, { status: 500, headers: corsHeaders });
  }
}

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



// Delete Comment by Comment ID

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: "Invalid comment id" }, { status: 400, headers: corsHeaders });
    }

    const result = await sql`
      DELETE FROM comments
      WHERE comment_id = ${id}::uuid
    `;

    if (result.count === 0) {
      return NextResponse.json({ error: "No comment" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ msg: "comment deleted successfully" }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500, headers: corsHeaders });
  }
}
