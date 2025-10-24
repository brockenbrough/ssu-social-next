import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";

export async function GET() {
  try {
    const testBody = {
      participants: [
        { userId: "11111111-1111-1111-1111-111111111111" },
        { userId: "22222222-2222-2222-2222-222222222222" }
      ]
    };

    const res = await fetch("http://localhost:3000/api/chatrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testBody),
    });
    const data = await res.json();

    if ((res.status === 200 || res.status === 201) && data.chatRoom) {
      return NextResponse.json({ success: true, message: "Chatrooms route OK", data });
    }

    return NextResponse.json({ success: false, message: `Unexpected status: ${res.status}`, data }, { status: res.status, headers: corsHeaders  });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Unknown error" }, { status: 500, headers: corsHeaders });
  }
}


