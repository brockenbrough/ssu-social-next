import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// GET /api/followers
export async function GET() {
  try {
    // Retrieve all users and their followers (with usernames instead of IDs)
    const rows = await sql<{
      username: string;
      followers: string[];
    }[]>`
      SELECT
        u.username AS "username",
        COALESCE(
          ARRAY_AGG(DISTINCT uf.username ORDER BY uf.username)
          FILTER (WHERE f.follower_id IS NOT NULL),
          '{}'
        ) AS "followers"
      FROM ssu_users u
      LEFT JOIN followers f ON f.user_id = u.user_id
      LEFT JOIN ssu_users uf ON uf.user_id = f.follower_id
      GROUP BY u.user_id, u.username
      ORDER BY u.username;
    `;

    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
}
