import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors"; 

import sql from "@/utilities/db";

// Allow CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await ctx.params;

    // Validate UUID
    if (!/^[0-9a-fA-F-]{36}$/.test(postId)) {
      return NextResponse.json(
        { error: "Invalid post id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const [row] = await sql<{ viewcount: number }[]>`
      SELECT COUNT(DISTINCT user_id)::int AS viewCount
      FROM views
      WHERE post_id = ${postId};
    `;

    return NextResponse.json(
      { viewCount: row?.viewcount ?? 0 },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching view count:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch view count",
        details: (error as any).message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
