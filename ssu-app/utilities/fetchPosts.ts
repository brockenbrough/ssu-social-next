// utilities/fetchPosts.ts
 

export type Post = {
  _id: string;
  userId: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  createdAt: string;
};

import sql from "@/utilities/db";

export default async function fetchPosts(query: string): Promise<Post[]> {
  const rows = await sql<Post[]>`
    SELECT post_id::text AS "_id",
           user_id::text AS "userId",
           content,
           image_uri AS "imageUri",
           is_sensitive AS "isSensitive",
           has_offensive_text AS "hasOffensiveText",
           created_at AS "createdAt"
    FROM posts
    WHERE content ILIKE ${'%' + query + '%'}
    ORDER BY created_at DESC
  `;
  return rows;
}
