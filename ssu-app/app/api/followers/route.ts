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

// GET /api/followers
export async function GET() {
  try {
    const rows = await sql`
      SELECT
        user_id::text AS "userId",
        COALESCE(
          ARRAY_AGG(follower_id::text ORDER BY follower_id)
          FILTER (WHERE follower_id IS NOT NULL),
          '{}'
        ) AS "followers"
      FROM followers  
      GROUP BY user_id
      ORDER BY user_id
    `;
    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as any)?.message ?? err) },
      { status: 500, headers: corsHeaders }
    );
  }
}