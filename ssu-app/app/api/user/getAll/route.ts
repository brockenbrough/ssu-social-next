import { NextResponse } from "next/server";
import postgres from "postgres";

// In these routes, we must match the field definitions in
// the original backend.  This means we have to rename some 
// fields (named differently in the new db schema) to match.
// We also have to return fields that don't exist in the new
// schema (imageId) as null, and we have to return password
// (which we don't store) as null to avoid breaking the frontend.
// We also have to coerce some types (role and _id) to string
// to match the original backend.

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

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

export async function GET() {
  try {
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
    `;

    // Redact password values to avoid leaking hashes; delete this map if you must return the stored password.
    const data = rows.map(u => ({ ...u, password: null }));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}