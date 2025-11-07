// app/test/message/markAsRead/route.ts
import { NextResponse } from "next/server";
 

import sql from "@/utilities/db";

// Toggle this if you want to keep the created message for manual inspection
const CLEANUP_AFTER_TEST = true;

export async function GET() {
  try {
    // 1) Create a test message using your existing create route
    const testMessage = {
      chatRoomId: "44444444-4444-4444-4444-444444444444", // fixed_chat_room_id
      senderId: "11111111-1111-1111-1111-111111111111",   // fixed_user_id1
      receiverId: "22222222-2222-2222-2222-222222222222", // fixed_user_id2
      text: "Test message for markAsRead integration.",
      isRead: false,
    };

    const createRes = await fetch("http://localhost:3000/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testMessage),
    });

    const createData = await createRes.json().catch(() => ({} as any));

    if (createRes.status !== 201 || !createData?.data?._id) {
      return NextResponse.json(
        {
          success: false,
          step: "create",
          message: `Create route failed (expected 201). Got ${createRes.status}`,
          response: createData,
        },
        { status: 500 }
      );
    }

    const createdId: string = createData.data._id;

    // 2) Call markAsRead with the created ID
    const markRes = await fetch("http://localhost:3000/api/message/markAsRead", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds: [createdId] }),
    });

    const markData = await markRes.json().catch(() => ({} as any));

    const expectedMsg = "Messages are marked as read successfully.";
    if (markRes.status !== 200 || markData?.message !== expectedMsg) {
      // Optional cleanup if creation succeeded but markAsRead failed
      if (CLEANUP_AFTER_TEST) {
        try {
          await sql`DELETE FROM messages WHERE message_id = ${createdId}::uuid`;
        } catch {}
      }
      return NextResponse.json(
        {
          success: false,
          step: "markAsRead",
          message: `markAsRead failed (expected 200 + message="${expectedMsg}"). Got ${markRes.status}`,
          response: markData,
        },
        { status: 500 }
      );
    }

    // 3) Verify in DB that is_read is TRUE
    const dbCheck = await sql<{ is_read: boolean }[]>`
      SELECT is_read FROM messages WHERE message_id = ${createdId}::uuid
    `;

    const isRead = dbCheck?.[0]?.is_read === true;

    // 4) Cleanup test data (optional)
    if (CLEANUP_AFTER_TEST) {
      await sql`DELETE FROM messages WHERE message_id = ${createdId}::uuid`;
    }

    if (!isRead) {
      return NextResponse.json(
        {
          success: false,
          step: "verify",
          message: "Database check failed: is_read is not TRUE after markAsRead.",
          createdId,
          markAsReadResponse: markData,
          dbCheck,
        },
        { status: 500 }
      );
    }

    // All good
    return NextResponse.json({
      success: true,
      message: "markAsRead integration passed: created → marked read → verified.",
      createdId,
      markAsReadResponse: markData,
      dbVerifiedIsRead: isRead,
      cleanedUp: CLEANUP_AFTER_TEST,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
