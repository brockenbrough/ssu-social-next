import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import { censorText } from "@/utilities/moderation";

import sql from "@/utilities/db";

export async function PUT(req: Request, ctx: { params: Promise<{ postId: string }> }) {
  try {
    console.log("=== UpdatePost Route Called ===");
    console.log("Request method:", req.method);

    // Await dynamic route params
    const { postId } = await ctx.params;
    console.log("Param postId:", postId);

    const body = await req.json();
    console.log("Body received:", body);

    const content = body.content;
    const isSensitive = body.isSensitive;

    if (!postId || !content) {
      console.warn("Missing required fields:", { postId, content });
      return NextResponse.json(
        { error: "Missing required fields: postId or content" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { text: censoredContent, changed } = await censorText(content);
    const hasOffensiveText = changed;

    // Update post
    const updated = await sql<{
      post_id: string;
      user_id: string;
      content: string;
      is_sensitive: boolean;
    }[]>`
      UPDATE posts
      SET 
        content = ${censoredContent}, 
        is_sensitive = COALESCE(${isSensitive}, is_sensitive)
      WHERE post_id = ${postId}::uuid
      RETURNING post_id, user_id, content, is_sensitive;
    `;

    console.log("Database update result:", updated);

    if (updated.length === 0) {
      console.warn("Post not found in database:", postId);
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log("Post updated successfully:", updated[0]);
    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
      post: updated[0],
    });

  } catch (err: any) {
    console.error("Update post error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update post" },
      { status: 500, headers: corsHeaders }
    );
  }
}
