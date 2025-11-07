import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

export async function GET() {
  const seededUserId = "11111111-1111-1111-1111-111111111111";
  const TEST_URL = "https://ssusocial.s3.amazonaws.com/profilepictures/test-profile-image.png";
  const DEFAULT_PROFILE_IMAGE = "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";

  try {
    // 1) Call the real route to set a test URL
    const res = await fetch("http://localhost:3000/api/user/uploadProfileImage", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify({ user_id: seededUserId, image_url: TEST_URL }),
    });

    if (!res.ok) {
      let body: any = null;
      try { body = await res.json(); } catch {}
      return NextResponse.json(
        { success: false, message: `uploadProfileImage returned ${res.status}`, data: body ?? null },
        { status: 500 }
      );
    }

    const json = await res.json();
    if (!json || typeof json !== "object" || typeof json.profileImage !== "string") {
      return NextResponse.json(
        { success: false, message: "Unexpected response structure from uploadProfileImage", data: json },
        { status: 500 }
      );
    }
    if (json.profileImage !== TEST_URL) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile image mismatch",
          data: { expected: TEST_URL, actual: json.profileImage },
        },
        { status: 500 }
      );
    }

    await sql`
      UPDATE ssu_users
      SET profile_image = ${DEFAULT_PROFILE_IMAGE}
      WHERE user_id = ${seededUserId}::uuid
    `;

    return NextResponse.json({
      success: true,
      message: "uploadProfileImage route verified for seeded user.",
      data: { userId: seededUserId, expected: TEST_URL },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}