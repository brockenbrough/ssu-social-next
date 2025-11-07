import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET /api/following
export async function GET() {
  try {
    const rows = await sql<{ userId: string; following: string[] }[]>`
      SELECT
        follower_id::text AS "userId",
        COALESCE(
          ARRAY_AGG(user_id::text ORDER BY user_id)
          FILTER (WHERE user_id IS NOT NULL),
          '{}'
        ) AS following
      FROM followers
      GROUP BY follower_id
      ORDER BY follower_id
    `;

    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Error fetching all following:", err);
    return NextResponse.json(
      { error: "Failed to fetch following list" },
      { status: 500, headers: corsHeaders }
    );
  }
}