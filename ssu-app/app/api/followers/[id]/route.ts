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

    export async function GET(
      _req: Request,
      ctx: { params: Promise<{ id: string }> }
    ) {
      try {
        const { id: userId } = await ctx.params;

        // Check that user exists
        const userRow = await sql`SELECT user_id FROM ssu_users WHERE user_id = ${userId}::uuid`;
        if (userRow.length === 0) {
          return NextResponse.json(
            { success: false, message: "User not found." },
            { status: 404, headers: corsHeaders }
          );
        }

        // Get the list of usernames this user is following
        const followerRows = await sql`
          SELECT u.username
          FROM followers f
          JOIN ssu_users u ON f.follower_id = u.user_id
          WHERE f.user_id = ${userId}::uuid
        `;

        const followers: string[] = followerRows.map((r) => r.username);

    return NextResponse.json(
      {
        success: true,
        message: "Followers list retrieved successfully",
        data: followers, // return directly
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Error fetching followers for user:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch followers list" },
      { status: 500, headers: corsHeaders }
    );
  }

}
