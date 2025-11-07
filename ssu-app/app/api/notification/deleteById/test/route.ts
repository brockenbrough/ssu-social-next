// app/api/notifications/deleteById/test/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Reusable fixed test IDs
const TEST_NOTIFICATION_ID = "bbbb1111-2222-3333-4444-555566667777";
const RECEIVER_USER_ID     = "11111111-1111-1111-1111-111111111111"; // fixed_user_id1
const ACTOR_USER_ID        = "22222222-2222-2222-2222-222222222222"; // fixed_user_id2

// Preflight support
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET() {
  const report: Record<string, any> = { seed: null, deleteCall: null, verify: null };

  try {
    // 1) Seed a predictable notification
    const [seeded] = await sql/* sql */`
      INSERT INTO notifications (
        notification_id, notification_type, user_id, action_user_id,
        content, post_id, is_read, created_at
      )
      VALUES (
        ${TEST_NOTIFICATION_ID}, 'like', ${RECEIVER_USER_ID}, ${ACTOR_USER_ID},
        'Unit-test delete seed', NULL, FALSE, NOW()
      )
      ON CONFLICT (notification_id) DO UPDATE
      SET content = EXCLUDED.content, is_read = FALSE
      RETURNING notification_id, content, is_read
    `;
    report.seed = { ok: !!seeded, row: seeded };

    // 2) Call the real DELETE endpoint via HTTP
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const base = host.startsWith("http") ? host : `http://${host}`;

    const resp = await fetch(`${base}/api/notification/deleteById/${TEST_NOTIFICATION_ID}`, {
      method: "DELETE",
      // No need to send CORS headers here; this is a server-to-server call
      cache: "no-store",
    });

    const json = await resp.json().catch(() => ({}));
    report.deleteCall = { status: resp.status, body: json };

    if (!resp.ok) {
      return NextResponse.json(
        { ok: false, step: "delete_call", report },
        { status: 500, headers: corsHeaders }
      );
    }

    // 3) Verify that the row was removed
    const remaining = await sql/* sql */`
      SELECT notification_id
      FROM notifications
      WHERE notification_id = ${TEST_NOTIFICATION_ID}
    `;
    const deleted = remaining.length === 0;
    report.verify = { ok: deleted, remainingCount: remaining.length };

    return NextResponse.json(
      { ok: deleted, report },
      { status: deleted ? 200 : 500, headers: corsHeaders }
    );
  } catch (err: any) {
    report.error = err?.message ?? String(err);
    return NextResponse.json(
      { ok: false, report },
      { status: 500, headers: corsHeaders }
    );
  }
}
