// app/api/feed/[username]/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

// Connect to Postgres
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type ApiPost = {
  _id: string;                // matches frontend expectations
  userId: string;             // foreign key
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  createdAt: string | Date;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await ctx.params;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const rows = await sql`
  SELECT p.post_id::text
  FROM posts p
  ORDER BY p.created_at DESC
`;

const ids = rows.map((r) => r.post_id); // extract the plain values

return NextResponse.json(
  { feed: ids },
  {
    status: 200,
    headers: corsHeaders,
  }
);
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
