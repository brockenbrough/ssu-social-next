// app/api/notifications/update/test/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Стабильные ID для воспроизводимого теста
const TEST_NOTIFICATION_ID = "dddd1111-bbbb-2222-cccc-3333dddd4444";
const RECEIVER_USER_ID     = "11111111-1111-1111-1111-111111111111"; // fixed_user_id1
const ACTOR_USER_ID        = "22222222-2222-2222-2222-222222222222"; // fixed_user_id2

export async function GET() {
  const report: Record<string, any> = {};

  try {
    // 1) Идемпотентная подготовка (seed) тестового уведомления
    const seeded = await sql/* sql */`
      INSERT INTO notifications (
        notification_id, notification_type, user_id, action_user_id, content, post_id, is_read, created_at
      )
      VALUES (
        ${TEST_NOTIFICATION_ID},
        'like',
        ${RECEIVER_USER_ID},
        ${ACTOR_USER_ID},
        'Unit test seed',
        NULL,
        FALSE,
        NOW()
      )
      ON CONFLICT (notification_id) DO UPDATE
      SET content = EXCLUDED.content, is_read = FALSE
      RETURNING notification_id, content, is_read
    `;
    report.seed = { ok: true, row: seeded[0] };

    // 2) Вызов РЕАЛЬНОГО апдейта через HTTP (тот же сервер)
    const resp = await fetch("http://localhost:3000/api/notifications/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: TEST_NOTIFICATION_ID,
        text: "Updated via UNIT TEST",
        isRead: true,
      }),
    });

    const json = await resp.json().catch(() => ({}));
    report.updateCall = { status: resp.status, body: json };
    if (!resp.ok) {
      return NextResponse.json({ ok: false, step: "updateCall", report }, { status: 500 });
    }

    // 3) Проверка результата в БД
    const [row] = await sql/* sql */`
      SELECT notification_id, content, is_read
      FROM notifications
      WHERE notification_id = ${TEST_NOTIFICATION_ID}
    `;
    const pass = row && row.content === "Updated via UNIT TEST" && row.is_read === true;
    report.verify = { ok: pass, row };

    return NextResponse.json({ ok: pass, report }, { status: pass ? 200 : 500 });
  } catch (err: any) {
    report.error = err?.message ?? String(err);
    return NextResponse.json({ ok: false, report }, { status: 500 });
  }
}
