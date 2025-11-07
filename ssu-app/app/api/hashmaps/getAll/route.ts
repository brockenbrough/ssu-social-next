import { NextResponse } from "next/server";
 

import { corsHeaders } from "@/utilities/cors";

// Connect to Postgres
import sql from "@/utilities/db";

// Define response type
type ApiHashtag = {
  hashtag_id: string;
  hashtag: string;
  created_at: string | Date;
};

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
    console.error("Error fetching hashtags:", error);
    return NextResponse.json(
      { error: "Failed to fetch hashtags" },
      { status: 500 }
    );
  }
}
