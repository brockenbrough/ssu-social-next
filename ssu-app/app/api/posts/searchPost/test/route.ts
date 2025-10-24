// searchPost.test.ts

import { GET } from "../route"; // adjust path if needed
import { NextRequest } from "next/server";

async function testSearchPost() {
  console.log("=== Test 1: Missing postId query ===");
  let req = new Request("http://localhost:3000/api/posts/searchPost");
  let res = await GET(req);
  let data = await res.json();
  console.log(data); // expect: { error: "Missing postId query parameter" }

  console.log("\n=== Test 2: Non-existent postId ===");
  req = new Request(
    "http://localhost:3000/api/posts/searchPost?postId=00000000-0000-0000-0000-000000000000"
  );
  res = await GET(req);
  data = await res.json();
  console.log(data); // expect: { error: "Post not found" }

  console.log("\n=== Test 3: Existing postId ===");
  const existingPostId = "ce9c2c05-eb7d-43c6-864f-07b78c91ce89"; // copy from your createPost
  req = new Request(
    `http://localhost:3000/api/posts/searchPost?postId=${existingPostId}`
  );
  res = await GET(req);
  data = await res.json();
  console.log(data); // expect: post object with _id === existingPostId
}

testSearchPost();
