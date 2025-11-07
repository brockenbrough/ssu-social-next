import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

type ApiHashtag = {
  hashtag_id: string;
  hashtag: string;
  created_at: string | Date;
};

// ✅ GET: retrieve all hashtags
export async function GET() {
  try {
    const rows = await sql<ApiHashtag[]>`
      SELECT
        hashtag_id::text AS "hashtag_id",
        hashtag          AS "hashtag",
        created_at       AS "created_at"
      FROM hashtags
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching hashtags:", error);
    return NextResponse.json(
      { error: "Failed to fetch hashtags" },
      { status: 500 }
    );
  }
}

// ✅ POST: create a new hashtag
export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { hashtag } = body;

    if (!hashtag || typeof hashtag !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'hashtag' field" },
        { status: 400 }
      );
    }

    hashtag = hashtag.trim();
    if (!hashtag.startsWith("#")) hashtag = `#${hashtag}`;

    // Validation: cannot be just "#"
    if (hashtag.length === 1) {
      return NextResponse.json(
        { error: "Hashtag cannot be empty" },
        { status: 400 }
      );
    }

    // Validation: length <= 255
    if (hashtag.length > 255) {
      return NextResponse.json(
        { error: "Hashtag exceeds maximum length of 255 characters" },
        { status: 400 }
      );
    }

    // Validation: allowed characters (letters, numbers, underscore)
    const hashtagBody = hashtag.slice(1); // remove '#'
    const validPattern = /^[A-Za-z0-9_]+$/;
    if (!validPattern.test(hashtagBody)) {
      return NextResponse.json(
        {
          error:
            "Hashtag can only contain letters, numbers, and underscores after '#'",
        },
        { status: 400 }
      );
    }

    // Insert, ignoring duplicates
    const result = await sql<ApiHashtag[]>`
      INSERT INTO hashtags (hashtag)
      VALUES (${hashtag})
      ON CONFLICT (hashtag) DO NOTHING
      RETURNING hashtag_id::text, hashtag, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { message: "Hashtag already exists", hashtag },
        { status: 200 }
      );
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("❌ Error creating hashtag:", error);
    return NextResponse.json(
      { error: "Failed to create hashtag" },
      { status: 500 }
    );
  }
}
