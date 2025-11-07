// app/api/user/getUserByUsername/[username]/route.ts
import { NextResponse, NextRequest } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(req: Request, context: any) {
  const params = await context.params;
  const { username } = params;
  const defaultProfileImageUrl =
    "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";

  try {
    const rows = await sql`
      SELECT
        user_id::text            AS "_id",
        username                 AS "username",
        profile_image            AS "profileImage",
        COALESCE(biography, '')  AS "biography"
      FROM ssu_users
      WHERE username = ${username}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const user = rows[0];
    return NextResponse.json(
      {
        _id: user._id,
        username: user.username,
        biography: user.biography,
        profileImage: user.profileImage || defaultProfileImageUrl,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}