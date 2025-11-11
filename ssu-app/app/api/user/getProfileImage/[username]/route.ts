import { NextRequest, NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";
const defaultProfileImageUrl =
  "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";

// GET /api/user/getProfileImage/:username
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> } // 👈 params is now a Promise
) {
  const { username } = await context.params; // 👈 await before destructuring

  try {
    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await sql`
      SELECT profile_image
      FROM ssu_users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404, headers: corsHeaders }
      );
    }

    // Return a same-origin proxy URL to avoid frontend CORS calls to S3
    const proxyUrl = new URL(
      `/api/user/profileImageProxy/${encodeURIComponent(username)}`,
      req.nextUrl.origin
    ).toString();

    return NextResponse.json(
      { success: true, imageUri: proxyUrl },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
  console.error("❌ Error fetching profile image:", error);
  return NextResponse.json(
    { success: false, message: error.message || "Server error." },
    { status: 500, headers: corsHeaders }
  );
}
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
