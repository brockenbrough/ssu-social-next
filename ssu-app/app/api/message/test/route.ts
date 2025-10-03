import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test data using fixed IDs from schema_load.sql
    const testMessage = {
      chatRoomId: "44444444-4444-4444-4444-444444444444", // fixed_chat_room_id
      senderId: "11111111-1111-1111-1111-111111111111",   // fixed_user_id1 (test_user1)
      receiverId: "22222222-2222-2222-2222-222222222222", // fixed_user_id2 (test_user2)
      text: "This is a test message for automated integration tests.",
      isRead: false,
    };

    // Call the route being tested
    const res = await fetch("http://localhost:3000/api/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testMessage),
    });
    const data = await res.json();

    // Check status code and expected structure
    if (res.status === 201 && data.data) {
      // Verify the response has expected fields
      const message = data.data;
      const hasRequiredFields =
        message._id &&
        message.chatRoomId === testMessage.chatRoomId &&
        message.senderId === testMessage.senderId &&
        message.receiverId === testMessage.receiverId &&
        message.text === testMessage.text &&
        typeof message.isRead === "boolean" &&
        message.date;

      if (hasRequiredFields) {
        return NextResponse.json({
          success: true,
          message: "Route returned expected 201 Created with test message.",
          data,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Route responded but data structure is incorrect.",
            data,
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Unexpected status: ${res.status}`,
          data,
        },
        { status: res.status }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}