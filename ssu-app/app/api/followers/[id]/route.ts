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
   type ApiUser = {
     _id: string;
     username: string;
  }

    export async function GET(
      _req: Request,
      ctx: { params: Promise<{ id: string }> }
    ) {
      try {
        const { id } = await ctx.params;

        // Support both UUID and username
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(id);
        let userId: string | null = null;

        if (isUuid) {
          userId = id;
        } else {
          const byUsername = await sql`SELECT user_id::text AS user_id FROM ssu_users WHERE username = ${id}`;
          if (byUsername.length === 0) {
            return NextResponse.json(
              { message: "User not found." },
              { status: 404, headers: corsHeaders }
            );
          }
          userId = byUsername[0].user_id as string;
        }

        // Get the list of followers' usernames
        const followerRows = await sql<ApiUser[]>`
        SELECT
          u.user_id::text          AS "_id",
          u.username               AS "username"
        FROM followers f
        JOIN ssu_users u ON f.follower_id = u.user_id
        WHERE f.user_id = ${userId}::uuid
        `;

        const followers: string[] = followerRows.map((r) => r.username);

        // Match legacy shape: [ { followers: [usernames] } ]
        return NextResponse.json(
          [ { followers } ],
          { status: 200, headers: corsHeaders }
        );
  } catch (err) {
    console.error("Error fetching followers for user:", err);
    return NextResponse.json(
      { message: "Failed to fetch followers list" },
      { status: 500, headers: corsHeaders }
    );
  }

}
