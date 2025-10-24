import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

// Initialize PostgreSQL connection
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Helper function for UUID validation
const isUuid = (s: string) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// POST /followers/follow
export async function POST(req: Request) {
  try {
    // Parse JSON request body
    const { userId, targetUserId } = await req.json();

    // Validate UUIDs
    if (!isUuid(userId) || !isUuid(targetUserId)) {
      return NextResponse.json(
        { success: false, message: "Invalid UUID(s)" },
        { status: 400, headers: corsHeaders }
      );
      return NextResponse.json(
        { success: false, message: "Invalid UUID(s)" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Prevent a user from following themselves
    if (userId === targetUserId) {
      return NextResponse.json(
        { success: false, message: "Cannot follow yourself" },
        { status: 400, headers: corsHeaders }
      );
      return NextResponse.json(
        { success: false, message: "Cannot follow yourself" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Insert a new follower relationship if it doesn't already exist
    await sql`
      INSERT INTO followers (user_id, follower_id, created_at)
      SELECT ${targetUserId}::uuid, ${userId}::uuid, NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM followers WHERE user_id = ${targetUserId}::uuid AND follower_id = ${userId}::uuid
      )
    `;

    // Return success response
    return NextResponse.json(
      { success: true, data: { userId, targetUserId } },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    // Handle errors and return structured response
    return NextResponse.json(
      { success: false, message: err?.message ?? String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
}