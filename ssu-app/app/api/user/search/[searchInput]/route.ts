import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

// This route mirrors the legacy backend: GET /user/search/:searchInput
// It returns an array of user objects with the same field names/types
// as the original API. Password is included as null to preserve shape
// without exposing hashes.

import sql from "@/utilities/db";

type ApiUser = {
  _id: string;
  username: string;
  email: string;
  password: string | null;
  date: string | Date;
  role: string;
  imageId: string | null;
  profileImage: string | null;
  biography: string;
};

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ searchInput: string }> }
) {
  try {
    const { searchInput } = await ctx.params;

    // Match legacy behavior: if no search input, return {}
    if (!searchInput) {
      return NextResponse.json({}, { status: 200, headers: corsHeaders });
    }

    const likeTerm = `%${searchInput}%`;

    const rows = await sql<ApiUser[]>`
      SELECT
        user_id::text            AS "_id",
        username                 AS "username",
        email                    AS "email",
        password                 AS "password",
        created_at               AS "date",
        role::text               AS "role",
        NULL::text               AS "imageId",
        profile_image            AS "profileImage",
        COALESCE(biography, '')  AS "biography"
      FROM ssu_users
      WHERE username ILIKE ${likeTerm}
    `;

    // Redact password to avoid leaking stored hashes
    const data = rows.map((u) => ({ ...u, password: null }));

    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}