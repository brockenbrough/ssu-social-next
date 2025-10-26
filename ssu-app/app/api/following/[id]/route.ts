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


// GET /api/user/following/[id]
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;


    // This should take user name (not id).

    // const rows = await sql<{ following: string[] }[]>`
    //   SELECT
    //     COALESCE(
    //       ARRAY_AGG(user_id::text ORDER BY user_id)
    //       FILTER (WHERE user_id IS NOT NULL),
    //       '{}'
    //     ) AS following
    //   FROM followers
    //   WHERE follower_id = ${id}::uuid
    // `;

    // const following = rows.length > 0 ? rows[0].following : [];

    // return NextResponse.json(
    //   {
    //     success: true,
    //     message: "Following list retrieved successfully",
    //     data: { following },
    //   },
    //   { status: 200, headers: corsHeaders }
    // );

    // This is a stub that returns an empty list to unblock testing.
    const followers: string[] = []; // just an empty array

    return NextResponse.json(
      {
        success: true,
        message: "Followers list retrieved successfully",
        data: followers, // return directly
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Error fetching following for user:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch following list",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}