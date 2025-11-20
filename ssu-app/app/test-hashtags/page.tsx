"use client";
import { useState } from "react";

export default function HashtagTestPage() {
  // Create hashtag
  const [createTag, setCreateTag] = useState("");
  const [createResult, setCreateResult] = useState("");

  // Attach hashtag
  const [postId, setPostId] = useState("");
  const [attachTag, setAttachTag] = useState("");
  const [attachResult, setAttachResult] = useState("");

  // Get posts by hashtag
  const [searchTag, setSearchTag] = useState("");
  const [searchResult, setSearchResult] = useState("");

  // ----- API CALLS -----

  async function handleCreateHashtag() {
    const res = await fetch("/api/hashmaps/createHashtag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hashtag: createTag }),
    });

    setCreateResult(await res.text());
  }

  async function handleAttachHashtag() {
  const res = await fetch("/api/posts/attachHashtags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      post_id: postId,
      hashtags: [attachTag], // MUST be array
    }),
  });

  setAttachResult(await res.text());
}


  async function handleFetchPosts() {
    const res = await fetch(
      `/api/posts/getByHashtag?tag=${encodeURIComponent(searchTag)}`
    );

    setSearchResult(await res.text());
  }

  return (
    <main className="p-8 space-y-12">
      <h1 className="text-3xl font-bold">Hashtag Testing Suite</h1>

      {/* CREATE HASHTAG */}
      <section className="p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Create Hashtag</h2>

        <div className="flex items-center space-x-3">
          <input
            className="border p-2"
            placeholder="#example"
            value={createTag}
            onChange={(e) => setCreateTag(e.target.value)}
          />
          <button
            className="bg-orange-500 text-white p-2 rounded"
            onClick={handleCreateHashtag}
          >
            Create
          </button>
        </div>

        <pre className="mt-3 bg-gray-100 p-3">{createResult}</pre>
      </section>

      {/* ATTACH HASHTAG */}
      <section className="p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">
          Attach Hashtag to Post
        </h2>

        <div className="flex items-center space-x-3">
          <input
            className="border p-2"
            placeholder="Post ID (UUID)"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
          />

          <input
            className="border p-2"
            placeholder="#example"
            value={attachTag}
            onChange={(e) => setAttachTag(e.target.value)}
          />

          <button
            className="bg-orange-500 text-white p-2 rounded"
            onClick={handleAttachHashtag}
          >
            Attach
          </button>
        </div>

        <pre className="mt-3 bg-gray-100 p-3">{attachResult}</pre>
      </section>

      {/* GET POSTS BY HASHTAG */}
      <section className="p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">
          Get Posts by Hashtag
        </h2>

        <div className="flex items-center space-x-3">
          <input
            className="border p-2"
            placeholder="#example"
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
          />

          <button
            className="bg-orange-500 text-white p-2 rounded"
            onClick={handleFetchPosts}
          >
            Search
          </button>
        </div>

        <pre className="mt-3 bg-gray-100 p-3">{searchResult}</pre>
      </section>
    </main>
  );
}
