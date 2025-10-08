import { NextResponse } from "next/server";
import postgres from "postgres";
import bcrypt from "bcrypt";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type ApiUser = {
  _id: string;
  username: string;
  email: string;
  password: string | null;
  role: string;
  imageId: string | null;
  profileImage: string | null;
  biography: string;
};

// POST /api/user/signup
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const usernameRows = await sql<ApiUser[]>`
      SELECT user_id::text AS "_id" 
      FROM ssu_users 
      WHERE username = ${username} 
      LIMIT 1
    `;
    if (usernameRows.length > 0) {
      return NextResponse.json(
        { message: "Username is taken, make another one" },
        { status: 409 }
      );
    }

    // Check if email already exists
    const emailRows = await sql<ApiUser[]>`
      SELECT user_id::text AS "_id" 
      FROM ssu_users 
      WHERE email = ${email} 
      LIMIT 1
    `;
    if (emailRows.length > 0) {
      return NextResponse.json(
        { message: "Email already exists, make another one" },
        { status: 409 }
      );
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const rows = await sql<ApiUser[]>`
      INSERT INTO ssu_users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
      RETURNING
        user_id::text AS "_id",
        username,
        email,
        password,
        role::text AS "role",
        NULL::text AS "imageId",
        NULL::text AS "profileImage",
        '' AS "biography"
    `;

    const newUser = rows[0];
    // Redact password before returning
    const safeUser = { ...newUser, password: null };

    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Server error during signup" },
      { status: 500 }
    );
  }
}