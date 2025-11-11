import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Request body shape:
// { "post_id": "uuid", "hashtags": ["#TestTag", "NewTag", "#Another"] }

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { post_id, hashtags } = body;

    if (!post_id || !Array.isArray(hashtags) || hashtags.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: post_id and non-empty hashtags array" },
        { status: 400 }
      );
    }

    // Step 1: Verify post exists
    const postCheck = await sql`SELECT post_id FROM posts WHERE post_id = ${post_id}`;
    if (postCheck.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Step 2: For each hashtag
    for (let rawTag of hashtags) {
      if (typeof rawTag !== "string") continue;

      let tag = rawTag.trim();
      if (!tag.startsWith("#")) tag = `#${tag}`;
      if (tag.length === 1) continue; // ignore just "#"

      // Validation: max length 255, valid chars
      if (tag.length > 255) continue;
      const validPattern = /^#[A-Za-z0-9_]+$/;
      if (!validPattern.test(tag)) continue;

      // Step 3: Upsert hashtag
      const tagResult = await sql<{ hashtag_id: string }[]>`
        INSERT INTO hashtags (hashtag)
        VALUES (${tag})
        ON CONFLICT (hashtag) DO UPDATE SET hashtag = EXCLUDED.hashtag
        RETURNING hashtag_id
      `;

      const hashtag_id =
        tagResult.length > 0
          ? tagResult[0].hashtag_id
          : (
              await sql<{ hashtag_id: string }[]>`
                SELECT hashtag_id FROM hashtags WHERE hashtag = ${tag}
              `
            )[0].hashtag_id;

      // Step 4: Link post and hashtag
      await sql`
        INSERT INTO post_hashtags (post_id, hashtag_id)
        VALUES (${post_id}, ${hashtag_id})
        ON CONFLICT DO NOTHING
      `;
    }

    return NextResponse.json(
      { success: true, message: "Hashtags successfully attached to post", post_id },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error attaching hashtags:", error);
    return NextResponse.json(
      { error: "Failed to attach hashtags" },
      { status: 500 }
    );
  }
}
