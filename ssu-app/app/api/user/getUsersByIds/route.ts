import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // must be service role for server routes
);

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const defaultProfileImageUrl =
  "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";

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

// POST /api/user/getUsersByIds
export async function POST(req: NextRequest) {
  try {
    const { userIds } = await req.json();

    if (!Array.isArray(userIds)) {
      return NextResponse.json(
        { message: "User IDs must be provided as an array" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (userIds.length === 0) {
      return NextResponse.json({}, { status: 200, headers: corsHeaders });
    }

    // Postgres query
    const rows = await sql<ApiUser[]>`
      SELECT
        user_id::text           AS "_id",
        username                AS "username",
        email                   AS "email",
        password                AS "password",
        created_at              AS "date",
        role::text              AS "role",
        NULL::text              AS "imageId",
        profile_image           AS "profileImage",
        COALESCE(biography,'')  AS "biography"
      FROM ssu_users
      WHERE user_id = ANY(${userIds}::uuid[])
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { message: "No users found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Validate images in S3
    const users = await Promise.all(
      rows.map(async (user) => {
        let profileImage = user.profileImage || defaultProfileImageUrl;

        if (user.profileImage) {
          try {
            const imageKey = decodeURIComponent(
              new URL(user.profileImage).pathname.substring(1)
            );

            const headCommand = new HeadObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME!,
              Key: imageKey,
            });

            await s3Client.send(headCommand);
          } catch (err: any) {
            if (err.name === "NotFound") {
              profileImage = defaultProfileImageUrl;
            } else {
              console.error("Error checking image in S3:", err);
            }
          }
        }

        return {
          ...user,
          password: null, // redact password
          profileImage,
        };
      })
    );

    return NextResponse.json(users, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}