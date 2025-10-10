import { NextResponse } from "next/server";
import postgres from "postgres";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

// POST /api/user/login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    console.log("=== Login attempt ===");
    console.log("Received username:", username);
    console.log("Received password (length):", password?.length, "value:", `"${password}"`);

    if (!username || !password) {
      console.log("Missing username or password");
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Fetch user by username
    const rows = await sql<ApiUser[]>`
      SELECT
        user_id::text           AS "_id",
        username,
        email,
        password,
        role::text              AS "role",
        NULL::text              AS "imageId",
        profile_image            AS "profileImage",
        COALESCE(biography, '') AS "biography"
      FROM ssu_users
      WHERE username = ${username}
      LIMIT 1
    `;

    console.log("Database rows fetched:", rows.length);
    if (rows.length === 0) {
      console.log("No user found with username:", username);
      return NextResponse.json(
        { message: "Username or password does not exist, try again" },
        { status: 401 }
      );
    }

    const user = rows[0];
    console.log("Fetched user from DB:", {
      _id: user._id,
      username: user.username,
      passwordLength: user.password?.length,
    });

    if (!user.password) {
      console.log("User has no password set");
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      );
    }

    // Check password
    console.log("Comparing password with bcrypt...");
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log("Password match result:", isValidPassword);

    if (!isValidPassword) {
      console.log("Password does not match for user:", username);
      return NextResponse.json(
        { message: "Username or password does not exist, try again" },
        { status: 401 }
      );
    }

    // Redact password before returning user
    const safeUser = { ...user, password: null };

    console.log("Generating JWT tokens...");
    const accessToken = jwt.sign(
      {
        id: safeUser._id,
        email: safeUser.email,
        username: safeUser.username,
        role: safeUser.role,
      },
      process.env.SUPABASE_JWT_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      {
        id: safeUser._id,
        email: safeUser.email,
        username: safeUser.username,
        role: safeUser.role,
      },
      process.env.SUPABASE_JWT_SECRET!,
      { expiresIn: "7d" }
    );

    console.log("Login successful for user:", username);

    return NextResponse.json(
      { user: safeUser, accessToken, refreshToken },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Server error during login" },
      { status: 500 }
    );
  }
}