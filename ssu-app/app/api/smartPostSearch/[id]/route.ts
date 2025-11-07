import { NextRequest, NextResponse } from "next/server";
import { PerronSearchAlgorithm, Post } from "@/utilities/perronsSearchAlgo";
import AIPersonalization from "@/utilities/searchAIModule";
import fetchPosts from "@/utilities/fetchPosts";
import fetchUserInteractions from "@/utilities/fetchUserInteractions";
import { corsHeaders } from "@/utilities/cors";

// Handle preflight CORS requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Validate search input
const validateSearchInput = async (req: NextRequest) => {
  const body = await req.json();
  const { query } = body;
  if (!query || typeof query !== "string" || !query.trim()) {
    return { valid: false, error: "Query must be a non-empty string." };
  }
  return { valid: true, query };
};

// POST handler
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await context.params;

  try {
    // Validate input
    const validation = await validateSearchInput(req);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers: corsHeaders }
      );
    }

    const query = validation.query;
    if (!query) {
        return NextResponse.json({ error: "Query must be a non-empty string." }, { status: 400 });
    }
    // Fetch posts
    const posts = await fetchPosts(query);
    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { message: "No posts found matching the query." },
        { status: 404, headers: corsHeaders }
      );
    }

    // Fetch user interactions
    const rawInteractions = await fetchUserInteractions(userId);

    // Transform interactions into { [postId: string]: string[] }
    const userInteractions: Record<string, string[]> = {};

    // Likes
    rawInteractions.likes.forEach((like) => {
      if (!userInteractions[like.post_id]) userInteractions[like.post_id] = [];
      userInteractions[like.post_id].push(like.post_id);
    });

    // Comments
    rawInteractions.comments.forEach((comment) => {
      if (!userInteractions[comment.post_id]) userInteractions[comment.post_id] = [];
      userInteractions[comment.post_id].push(comment.comment_id);
    });

    // (Optional) Include followings if relevant to post ranking
    // rawInteractions.followings.forEach((follow) => { ... });

    // Apply Perron search filtering
    const perronSearch = new PerronSearchAlgorithm(posts, userInteractions);
    perronSearch.buildAdjacencyMatrix();
    perronSearch.computePerronVector();
    const filteredPosts: (Post & { score: number })[] = perronSearch.filterPosts();

    // AI personalization
    const aiPersonalization = new AIPersonalization(query);
    const personalizedScores = aiPersonalization.computeRelevance(
      filteredPosts.map((post) => ({ content: post.content }))
    );

    // Combine results with relevance scores
    const results = filteredPosts.map((post, index) => ({
      ...post,
      relevanceScore: personalizedScores[index],
    }));

    return NextResponse.json({ results }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error during search process:", error);
    return NextResponse.json(
      { error: "An error occurred during the search process." },
      { status: 500, headers: corsHeaders }
    );
  }
}
