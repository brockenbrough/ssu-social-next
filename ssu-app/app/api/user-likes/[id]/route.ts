import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET /api/user-likes/[userId]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id: userId } = params;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }

  try {
    // Fetch all posts liked by this user
    const likedPosts = await sql<{ post_id: string }[]>`
      SELECT post_id
      FROM likes
      WHERE user_id = ${userId}::uuid
    `;

    // Format to match your frontend expectation
    const response = likedPosts.map((row) => ({ postId: row.post_id }));

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("Error fetching user likes:", err);
    return NextResponse.json({ error: "Failed to fetch user likes" }, { status: 500 });
  }
}