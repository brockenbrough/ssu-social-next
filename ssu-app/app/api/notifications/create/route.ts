// app/api/notifications/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { notification_type, user_id, content, action_user_id, post_id } = await req.json();

    if (!notification_type || !user_id) {
      return NextResponse.json(
        { success: false, error: "notification_type and user_id are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert([{ notification_type, user_id, content, action_user_id, post_id }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, notification: data[0] });
  } catch (err: any) {
    console.error("Error creating notification:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
