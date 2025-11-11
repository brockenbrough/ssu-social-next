// app/api/user/deleteAll/route.ts
import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

const DELETED_USER_ID = "00000000-0000-0000-0000-000000000000";

// Handle preflight CORS requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST() {
  try {
    console.log("DELETE ALL: Starting deletion of all users except [deleted]");

    // ===== Reassign Likes =====
    await sql`
      UPDATE likes
      SET user_id = ${DELETED_USER_ID}
      WHERE user_id != ${DELETED_USER_ID};
    `;
    console.log("Likes reassigned to [deleted] user");

    // ===== Reassign Followers (safe) =====
    await sql`
      -- Insert reassigned followers, skipping duplicates
      INSERT INTO followers (user_id, follower_id, created_at)
      SELECT ${DELETED_USER_ID}, follower_id, created_at
      FROM followers
      WHERE user_id != ${DELETED_USER_ID}
      ON CONFLICT DO NOTHING;
    `;

    await sql`
      -- Remove old rows that were reassigned
      DELETE FROM followers
      WHERE user_id != ${DELETED_USER_ID};
    `;
    console.log("Followers reassigned to [deleted] user safely");

  // ===== Reassign Messages =====
  await sql`
    UPDATE messages
    SET 
      sender_id = ${DELETED_USER_ID},
      receiver_id = ${DELETED_USER_ID}
    WHERE sender_id != ${DELETED_USER_ID} OR receiver_id != ${DELETED_USER_ID};
  `;
  console.log("Messages reassigned to [deleted] user (both sender and receiver)");


    // ===== Reassign Posts =====
    await sql`
      UPDATE posts
      SET user_id = ${DELETED_USER_ID}
      WHERE user_id != ${DELETED_USER_ID};
    `;
    console.log("Posts reassigned to [deleted] user");

    // ===== Reassign Comments =====
    await sql`
      UPDATE comments
      SET user_id = ${DELETED_USER_ID}
      WHERE user_id != ${DELETED_USER_ID};
    `;
    console.log("Comments reassigned to [deleted] user");

    // ===== Delete All Other Users =====
    const deletedUsers = await sql`
      DELETE FROM ssu_users
      WHERE user_id != ${DELETED_USER_ID}
      RETURNING *;
    `;
    console.log(`Deleted ${deletedUsers.length} users`);

    return NextResponse.json({ success: true, deletedCount: deletedUsers.length }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error deleting all users:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500, headers: corsHeaders });
  }
}
