import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // Validate UUID (same style as your working "following" route)
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    // Return followers (people who follow this user)
    // Type rows explicitly to get a string[] "followers"
    const rows = await sql<{ followers: string[] }[]>`
      SELECT
        COALESCE(
          ARRAY_AGG(follower_id::text ORDER BY follower_id)
          FILTER (WHERE follower_id IS NOT NULL),
          '{}'
        ) AS followers
      FROM followers
      WHERE user_id = ${id}::uuid
    `;

    const followers = rows.length > 0 ? rows[0].followers : [];

    return NextResponse.json(
      {
        success: true,
        message: "Followers list retrieved successfully",
        data: { followers },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching followers for user:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch followers list",
      },
      { status: 500 }
    );
  }
}
