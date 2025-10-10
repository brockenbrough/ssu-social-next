import { NextResponse } from "next/server";

export async function GET() {
  try {
    const seededSenderId = "11111111-1111-1111-1111-111111111111";
    const expected = {
      _id: "55555555-5555-5555-5555-555555555555",
      chatRoomId: "44444444-4444-4444-4444-444444444444",
      senderId: "11111111-1111-1111-1111-111111111111",
      receiverId: "22222222-2222-2222-2222-222222222222",
      text: "This is a seeded test message.",
    };

    const res = await fetch(`http://localhost:3000/api/message/getByUserId/${seededSenderId}`);
    const json = await res.json();

    if (!json || !Array.isArray(json.data)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unexpected response structure from getByUserId route",
          data: json,
        },
        { status: 500 }
      );
    }

    const messages = json.data;
    const found = messages.find((m: any) => m._id === expected._id);

    if (!found) {
      return NextResponse.json(
        {
          success: false,
          message: "Seeded message not found for the seeded sender.",
          data: { messages },
        },
        { status: 500 }
      );
    }

    const fieldsMismatch =
      found.chatRoomId !== expected.chatRoomId ||
      found.senderId !== expected.senderId ||
      found.receiverId !== expected.receiverId ||
      found.text !== expected.text;

    if (fieldsMismatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Seeded message found but fields do not match expected values.",
          data: { expected, found },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Seeded message retrieved successfully",
      data: { message: found },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}