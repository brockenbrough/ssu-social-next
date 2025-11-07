import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";
import { reviveDates } from "@/utilities/reviveDates";

// Connect to Postgres
import sql from "@/utilities/db";

type ApiPost = {
  _id: string;                // matches frontend expectations
  userId: string;             // foreign key
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  createdAt: string | Date;
};

export async function GET() {
  try {
    const rows = await sql<ApiPost[]>`
      SELECT
        post_id::text        AS "_id",
        user_id::text        AS "userId",
        content              AS "content",
        image_uri            AS "imageUri",
        is_sensitive         AS "isSensitive",
        has_offensive_text   AS "hasOffensiveText",
        created_at           AS "date"
      FROM posts
      ORDER BY created_at DESC
    `;

    const posts = reviveDates(rows);

    return NextResponse.json(posts, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}