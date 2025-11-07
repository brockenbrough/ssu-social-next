import { NextRequest, NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET /api/user-likes/[userId]
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }>} 
)
  {
  const { id } = await ctx.params;

  if (!id) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }

  try {
    // Fetch all posts liked by this user
    const likedPosts = await sql<{ post_id: string }[]>`
      SELECT post_id
      FROM likes
      WHERE user_id = ${id}::uuid
    `;

    // Format to match your frontend expectation
    const response = likedPosts.map((row) => ({ postId: row.post_id }));

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("Error fetching user likes:", err);
    return NextResponse.json({ error: "Failed to fetch user likes" }, { status: 500 });
  }
}