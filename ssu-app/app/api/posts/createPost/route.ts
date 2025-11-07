import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import { censorText } from "@/utilities/moderation";

import sql from "@/utilities/db";

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
  username: string;
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
    const { username, content, imageUri, isSensitive } = body;

    const { text: censoredContent, changed } = await censorText(content);
    const hasOffensiveText = changed;

    // Step 1: Validate
    if (!username || !content) {
      return NextResponse.json(
        { error: "Missing required fields: username or content" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Step 2: INSERT with JOIN and RETURN username
    const rows = await sql<ApiPost[]>`
      INSERT INTO posts (
        user_id,
        content,
        image_uri,
        is_sensitive,
        has_offensive_text,
        created_at
      )
      SELECT 
        u.user_id,
        ${censoredContent},
        ${imageUri || null},
        ${isSensitive ?? false},
        ${hasOffensiveText},
        NOW()
      FROM ssu_users u
      WHERE u.username = ${username}
      RETURNING
        post_id::text        AS "_id",
        user_id::text        AS "userId",
        ${username}          AS "username",
        content              AS "content",
        image_uri            AS "imageUri",
        is_sensitive         AS "isSensitive",
        has_offensive_text   AS "hasOffensiveText",
        created_at::text     AS "date"
    `;

    // Step 3: Handle case where username not found
    if (rows.length === 0) {
      return NextResponse.json(
        { error: `User not found for username: ${username}` },
        { status: 404, headers: corsHeaders }
      );
    }

    // Step 4: Return created post
    return NextResponse.json(rows[0], { status: 201, headers: corsHeaders });

  } catch (err: any) {
    console.error("Error creating post:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create post", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
