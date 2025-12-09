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

    const userRows = await sql<{ user_id: string }[]>`
      SELECT user_id::text AS user_id
      FROM ssu_users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const targetUserId = userRows[0].user_id; 

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
        COALESCE(fow.following_count, 0) AS "followingCount",
        CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END AS "isLiked"
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

      -- Check if current user liked the post
      LEFT JOIN likes ul
        ON ul.post_id = p.post_id
        AND ul.user_id = (
          SELECT user_id
          FROM ssu_users
          WHERE username = ${username} 
          LIMIT 1
        )
  
      ORDER BY p.created_at DESC
    `;
    const postsWithDates = reviveDates(rows);


   if (rows.length > 0) {
      await sql`
        INSERT INTO views (user_id, post_id)
        SELECT ${targetUserId}::uuid, p.post_id
        FROM posts p
        WHERE p.user_id = ${targetUserId}::uuid
        ORDER BY p.created_at DESC
        ON CONFLICT (user_id, post_id) DO NOTHING
      `;
    }



    return NextResponse.json(postsWithDates, { status: 200, headers: corsHeaders });


  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json(
      { error: "Failed to load feed." },
      { status: 500, headers: corsHeaders }
    );
  }
}
