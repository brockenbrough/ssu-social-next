import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

type ApiPost = {
  _id: string;
  userId: string;
  username: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  date: string | Date;
  createdAt: string | Date;
};

// Handle CORS preflight for clients that send custom headers
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: Request,
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

    // Include username + canonical date field so the frontend can render tooltips and avatars
    const rows = await sql<ApiPost[]>`
      SELECT
        p.post_id::text          AS "_id",
        p.user_id::text          AS "userId",
        u.username               AS "username",
        p.content                AS "content",
        p.image_uri              AS "imageUri",
        p.is_sensitive           AS "isSensitive",
        p.has_offensive_text     AS "hasOffensiveText",
        p.created_at             AS "date",
        p.created_at             AS "createdAt"
      FROM posts p
      JOIN ssu_users u ON p.user_id = u.user_id
      WHERE p.content ILIKE ${like}
      ORDER BY p.created_at DESC
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
