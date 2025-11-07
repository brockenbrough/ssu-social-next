import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// DELETE /api/posts/deletePost/[id]
export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    // Validate UUID
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: "Invalid post id" }, 
      { status: 400, headers: corsHeaders }
      );
    }

    // Attempt to delete the post
    const result = await sql<{ deleted: boolean }[]>`
      DELETE FROM posts
      WHERE post_id = ${id}::uuid
      RETURNING TRUE AS deleted;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Post deleted successfully", data: { postId: id } },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete post" },
      { status: 500, headers: corsHeaders }
    );
  }
}
