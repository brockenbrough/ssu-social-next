import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";


const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
const isUuid = (s: string) => /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(s);

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// POST /followers/follow
export async function POST(req: Request) {
  try {
    const { userId, targetUserId } = await req.json();

    if (!isUuid(userId) || !isUuid(targetUserId)) {
      return NextResponse.json(
        { success: false, message: "Invalid UUID(s)" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (userId === targetUserId) {
      return NextResponse.json(
        { success: false, message: "Cannot follow yourself" },
        { status: 400, headers: corsHeaders }
      );
    }

    // followers(user_id = being followed, follower_id = who follows)
    await sql`
      INSERT INTO followers (user_id, follower_id, created_at)
      SELECT ${targetUserId}::uuid, ${userId}::uuid, NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM followers WHERE user_id = ${targetUserId}::uuid AND follower_id = ${userId}::uuid
      )
    `;

    return NextResponse.json(
      { success: true, data: { userId, targetUserId } },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
}