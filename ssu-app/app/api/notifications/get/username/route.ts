// app/api/notifications/get/usernameRoute.ts
// app/api/notifications/get/username/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Secure server-only Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required." },
        { status: 400 }
      );
    }

    // Step 1: Lookup the user's UUID
    const { data: user, error: userError } = await supabase
      .from("ssu_users")
      .select("user_id")
      .eq("username", username)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    // Step 2: Fetch notifications for this user
    const { data: notifications, error: notifError } = await supabase
      .from("notifications")
      .select(
        "notification_id, notification_type, content, is_read, post_id, created_at, action_user_id"
      )
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: false });

    if (notifError) throw notifError;

    return NextResponse.json({ success: true, notifications });
  } catch (err: any) {
    console.error("Error fetching notifications by username:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
