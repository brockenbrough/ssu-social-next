import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// GET /api/following/:id gets all the user IDs that this user is following
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // params.id is available immediately here
    const id = params.id;

    const [row] = await sql<{ followers: string[] }[]>`
      SELECT
        COALESCE(
          ARRAY_AGG(follower_id::text ORDER BY follower_id)
          FILTER (WHERE follower_id IS NOT NULL),
          '{}'
        ) AS followers
      FROM followers
      WHERE user_id = ${id}::uuid
    `;

    const doc = {
      userId: id,
      following: row?.followers || [],
    };

    return NextResponse.json(doc, { status: 200 });
  } catch (err) {
    console.error("Error fetching following:", err);
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}