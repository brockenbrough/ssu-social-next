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

type ApiPost = {
  _id: string;
  userId: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  createdAt: string | Date;
};

// POST /api/posts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, content, imageUri, isSensitive, hasOffensiveText } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { error: "Missing required fields: userId or content" },
        { status: 400, headers: corsHeaders }
      );
    }

    const rows = await sql<ApiPost[]>`
      INSERT INTO posts (
        user_id,
        content,
        image_uri,
        is_sensitive,
        has_offensive_text,
        created_at
      )
      VALUES (
        ${userId}::uuid,
        ${content},
        ${imageUri || null},
        ${isSensitive ?? false},
        ${hasOffensiveText ?? false},
        NOW()
      )
      RETURNING
        post_id::text        AS "_id",
        user_id::text        AS "userId",
        content              AS "content",
        image_uri            AS "imageUri",
        is_sensitive         AS "isSensitive",
        has_offensive_text   AS "hasOffensiveText",
        created_at           AS "createdAt"
    `;

    return NextResponse.json(rows[0], { status: 201, headers: corsHeaders });
  } catch (err: any) {
    console.error("Error creating post:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create post", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}