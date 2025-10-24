// app/api/notifications/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ success: false, error: "user_id is required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("notification_id, notification_type, content, is_read, post_id, created_at, action_user_id")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, notifications: data });
  } catch (err: any) {
    console.error("Error fetching notifications:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
