import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// GET /api/following
// Retrieves a list of all users and who they are following
export async function GET() {
  try {
    const rows = await sql<{ userId: string; following: string[] }[]>`
      SELECT
        user_id::text AS "userId",
        COALESCE(
          ARRAY_AGG(follower_id::text ORDER BY follower_id)
          FILTER (WHERE follower_id IS NOT NULL),
          '{}'
        ) AS following
      FROM followers
      GROUP BY user_id
      ORDER BY user_id
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching all following:", error);
    return NextResponse.json(
      { error: "Failed to fetch following list" },
      { status: 500 }
    );
  }
}