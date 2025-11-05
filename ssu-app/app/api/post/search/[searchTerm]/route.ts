import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(
  req: Request,
  ctx: { params: Promise<{ searchTerm: string }> }
) {
  try {
    const { searchTerm } = await ctx.params;

    if (!searchTerm || searchTerm.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing search term in path" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Decode URL-encoded search term (e.g., "This%20is" -> "This is")
    const decodedTerm = decodeURIComponent(searchTerm);
    const like = `%${decodedTerm}%`;
    
    const rows = await sql`
      SELECT
        post_id::text AS "_id",
        user_id::text AS "userId",
        content,
        image_uri AS "imageUri",
        is_sensitive AS "isSensitive",
        has_offensive_text AS "hasOffensiveText",
        created_at AS "createdAt"
      FROM posts
      WHERE content ILIKE ${like}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(rows, { headers: corsHeaders });
  } catch (err: any) {
    console.error("Error searching posts:", err);
    return NextResponse.json(
      { success: false, message: "Error searching posts" },
      { status: 500, headers: corsHeaders }
    );
  }
}

