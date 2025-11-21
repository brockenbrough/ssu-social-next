// app/api/feed/[username]/route.ts
import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";
import { reviveDates } from "@/utilities/reviveDates";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await ctx.params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const rows = await sql`
      WITH user_target AS (
        SELECT user_id
        FROM ssu_users
        WHERE username = ${username}
      )
      SELECT
        p.post_id::text AS "_id",
        p.content,
        p.image_uri AS "imageUri",
        p.created_at AS "date",
        u.username,
        u.user_id::text as "userid",
        COALESCE(u.profile_image, 'https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png') AS "profileImage",
        COALESCE(l.like_count, 0) AS "likeCount",
        COALESCE(c.comment_count, 0) AS "commentCount",
        COALESCE(v.view_count, 0) AS "viewCount",
        COALESCE(fol.follower_count, 0) AS "followerCount",
        COALESCE(fow.following_count, 0) AS "followingCount"
      FROM posts p
      JOIN ssu_users u ON p.user_id = u.user_id


      LEFT JOIN (
        SELECT post_id, COUNT(*)::int AS like_count
        FROM likes
        GROUP BY post_id
      ) l ON l.post_id = p.post_id

      LEFT JOIN (
        SELECT post_id, COUNT(*)::int AS comment_count
        FROM comments
        GROUP BY post_id
      ) c ON c.post_id = p.post_id

      LEFT JOIN (
        SELECT post_id, COUNT(*)::int AS view_count
        FROM views
        GROUP BY post_id
      ) v ON v.post_id = p.post_id

      -- Followers count of the post author
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int AS follower_count
        FROM followers
        GROUP BY user_id
      ) fol ON fol.user_id = p.user_id

      -- Following count of the post author
      LEFT JOIN (
        SELECT follower_id AS user_id, COUNT(*)::int AS following_count
        FROM followers
        GROUP BY follower_id
      ) fow ON fow.user_id = p.user_id      

      ORDER BY p.created_at DESC
      LIMIT 20
    `;
    const postsWithDates = reviveDates(rows);

    return NextResponse.json(postsWithDates, { status: 200, headers: corsHeaders });


  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json(
      { error: "Failed to load feed." },
      { status: 500, headers: corsHeaders }
    );
  }
}
