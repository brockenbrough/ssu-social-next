 

import sql from "@/utilities/db";

export type UserInteractions = {
  likes: { post_id: string; created_at: string }[];
  comments: { post_id: string; comment_id: string; content: string; created_at: string }[];
  followings: { user_id: string; follower_id: string; created_at: string }[];
};

/**
 * Fetch user interactions from the database.
 * @param userId - The userId of the user.
 * @returns An object containing the user's interactions.
 */
export default async function fetchUserInteractions(userId: string): Promise<UserInteractions> {
  try {
    if (!userId) {
      throw new Error("User ID is required to fetch user interactions.");
    }

    const [likesResult, commentsResult, followingsResult] = await Promise.all([
      fetchLikes(userId),
      fetchComments(userId),
      fetchFollowings(userId),
    ]);

    return {
      likes: likesResult,
      comments: commentsResult,
      followings: followingsResult,
    };
  } catch (error: any) {
    console.error(`Error fetching user interactions: ${error.message}`);
    throw error;
  }
}

async function fetchLikes(userId: string) {
  const result = await sql<{
    post_id: string;
    created_at: string;
  }[]>`
    SELECT post_id::text, created_at::text
    FROM likes
    WHERE user_id = ${userId}
  `;
  return result;
}

async function fetchComments(userId: string) {
  const result = await sql<{
    comment_id: string;
    post_id: string;
    content: string;
    created_at: string;
  }[]>`
    SELECT comment_id::text, post_id::text, comment_content AS content, created_at::text
    FROM comments
    WHERE user_id = ${userId}
  `;
  return result;
}

async function fetchFollowings(userId: string) {
  const result = await sql<{
    user_id: string;
    follower_id: string;
    created_at: string;
  }[]>`
    SELECT user_id::text, follower_id::text, created_at::text
    FROM followers
    WHERE follower_id = ${userId}
  `;
  return result;
}
