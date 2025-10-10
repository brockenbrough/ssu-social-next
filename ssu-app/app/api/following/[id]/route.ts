import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // Validate UUID
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    const rows = await sql<{ following: string[] }[]>`
      SELECT
        COALESCE(
          ARRAY_AGG(user_id::text ORDER BY user_id)
          FILTER (WHERE user_id IS NOT NULL),
          '{}'
        ) AS following
      FROM followers
      WHERE follower_id = ${id}::uuid
    `;

    const following = rows.length > 0 ? rows[0].following : [];

    return NextResponse.json(
      {
        success: true,
        message: "Following list retrieved successfully",
        data: { following },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching following for user:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch following list",
      },
      { status: 500 }
    );
  }
}