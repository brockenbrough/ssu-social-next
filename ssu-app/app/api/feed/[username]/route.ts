// app/api/feed/[username]/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

// Connect to Postgres
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

type ApiPost = {
  post_id: any;
  _id: string;                // matches frontend expectations
  userId: string;             // foreign key
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  createdAt: string | Date;
};

// GET /api/feed/[username]
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await ctx.params;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch posts for the user
    const rows = await sql<ApiPost[]>`
      SELECT
        p.post_id::text
      FROM posts p
      ORDER BY p.created_at DESC
    `;

    // The following fetches by username.  I have turned this off for now.
        // p.user_id::text AS "userId",
        // p.content,
        // p.image_uri AS "imageUri",
        // p.is_sensitive AS "isSensitive",
        // p.has_offensive_text AS "hasOffensiveText",
        // p.created_at AS "createdAt
      // JOIN ssu_users u ON p.user_id = u.user_id
      // WHERE u.username = ${username}

      
    const postIds = rows.map((row) => row.post_id);

    return NextResponse.json(
      { feed: postIds },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500, headers: corsHeaders }
    );
  }
}