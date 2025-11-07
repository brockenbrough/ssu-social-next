import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

// ✅ Create a single SQL client (same convention as other routes)
import sql from "@/utilities/db";

// Define the expected type of a returned post
type ApiPost = {
  post_id: string;
  content: string;
  created_at: string;
  username: string;
  profile_image: string | null;
  hashtag: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");

  if (!tag || tag.trim().length === 0) {
    return NextResponse.json(
      { success: false, message: "Missing or empty 'tag' query parameter." },
      { status: 400 }
    );
  }

  const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;

  try {
    const rows = await sql<ApiPost[]>`
      SELECT 
        p.post_id::text       AS "post_id",
        p.content             AS "content",
        p.created_at          AS "created_at",
        u.username            AS "username",
        u.profile_image       AS "profile_image",
        h.hashtag             AS "hashtag"
      FROM posts p
      JOIN post_hashtags ph ON p.post_id = ph.post_id
      JOIN hashtags h ON ph.hashtag_id = h.hashtag_id
      JOIN ssu_users u ON p.user_id = u.user_id
      WHERE h.hashtag = ${normalizedTag}
      ORDER BY p.created_at DESC;
    `;

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No posts found for hashtag '${normalizedTag}'.`,
        posts: [],
      });
    }

    return NextResponse.json({
      success: true,
      hashtag: normalizedTag,
      count: rows.length,
      posts: rows,
    });
  } catch (error) {
    console.error("Error fetching posts by hashtag:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch posts by hashtag." },
      { status: 500 }
    );
  }
}
