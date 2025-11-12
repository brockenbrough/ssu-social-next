import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

type Body = {
  userId?: string;        // username OR UUID of the follower (the logged-in user)
  targetUserId?: string;  // username OR UUID of the target profile
};

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// ----- CORS preflight -----
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// ----- DELETE /api/followers/unfollow -----
// Accepts { userId, targetUserId } where each can be a username or UUID.
// Removes the row where follower_id = userId AND user_id = targetUserId.
export async function DELETE(req: Request) {
  try {
    const body: Body = await req.json().catch(() => ({} as Body));
    const rawFollower = (body.userId ?? "").trim();
    const rawTarget = (body.targetUserId ?? "").trim();

    if (!rawFollower || !rawTarget) {
      return NextResponse.json(
        { ok: false, error: "Missing userId or targetUserId" },
        { status: 400, headers: corsHeaders }
      );
    }
    if (rawFollower === rawTarget) {
      return NextResponse.json(
        { ok: false, error: "Cannot unfollow yourself" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Resolve follower_id (logged-in user) to UUID
    const followerId = await resolveUserId(rawFollower);
    if (!followerId) {
      // Idempotent: 200 with removed:0 keeps UI logic simple
      return NextResponse.json(
        { ok: true, removed: 0 },
        { status: 200, headers: corsHeaders }
      );
    }

    // Resolve target user_id (profile) to UUID
    const targetUserId = await resolveUserId(rawTarget);
    if (!targetUserId) {
      return NextResponse.json(
        { ok: true, removed: 0 },
        { status: 200, headers: corsHeaders }
      );
    }

    // Perform delete (idempotent)
    const result = await sql<[{ count: string }]>`
      WITH del AS (
        DELETE FROM followers
        WHERE follower_id = ${followerId}::uuid
          AND user_id     = ${targetUserId}::uuid
        RETURNING 1
      )
      SELECT COUNT(*)::text AS count FROM del
    `;

    const removed = parseInt(result?.[0]?.count ?? "0", 10);

    return NextResponse.json(
      { ok: true, removed },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ---- helpers ----
async function resolveUserId(key: string): Promise<string | null> {
  if (UUID_RE.test(key)) return key;
  const rows = await sql<{ user_id: string }[]>`
    SELECT user_id::text AS user_id
    FROM ssu_users
    WHERE username = ${key}
    LIMIT 1
  `;
  return rows.length ? rows[0].user_id : null;
}
