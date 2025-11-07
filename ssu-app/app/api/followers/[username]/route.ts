import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> }   // Same pattern as notifications
) {
  try {
    const { username } = await ctx.params;

    // Get user_id for this username
    const users = await sql<{ user_id: string }[]>`
      SELECT user_id
      FROM ssu_users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json([], { status: 200, headers: corsHeaders });
    }

    const userId = users[0].user_id;

    // Fetch followers for that user
    const followers = await sql<{ username: string }[]>`
      SELECT u.username
      FROM followers f
      JOIN ssu_users u ON f.follower_id = u.user_id
      WHERE f.user_id = ${userId}
      ORDER BY u.username
    `;

    // Return in the format frontend expects (array with one object)
    const result = [{
      username: username,
      followers: followers.map(f => f.username)
    }];

    return NextResponse.json(result, { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error("Error fetching followers:", err);
    return NextResponse.json(
      { error: "Could not fetch followers" }, 
      { status: 500, headers: corsHeaders }
    );
  }
}