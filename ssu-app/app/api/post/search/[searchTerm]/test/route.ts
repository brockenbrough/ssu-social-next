// post/search/[searchTerm].test.ts

import { GET } from "../route";

async function testPostSearch() {
  console.log("=== Test A: Keyword search (path: /f) ===");
  let req = new Request("http://localhost:3000/api/post/search/f");
  let res = await GET(req, { params: Promise.resolve({ searchTerm: "f" }) });
  let data = await res.json();
  console.log(Array.isArray(data), data.length);

  console.log("\n=== Test B: Keyword search (path: /fixed) ===");
  req = new Request("http://localhost:3000/api/post/search/fixed");
  res = await GET(req, { params: Promise.resolve({ searchTerm: "fixed" }) });
  data = await res.json();
  console.log(Array.isArray(data), data.length); // expect: true, >= 2 from seeds

  console.log("\n=== Test C: Phrase search (path: /This%20is) ===");
  req = new Request("http://localhost:3000/api/post/search/This%20is");
  res = await GET(req, { params: Promise.resolve({ searchTerm: "This%20is" }) });
  data = await res.json();
  console.log(Array.isArray(data), data.length); // expect: true, >= 2
}

testPostSearch();

