'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from 'react';

type Post = {
  _id: string;
  userId: string;
  username?: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  date: string | Date;
};

type Bookmark = {
  bookmark_id: string;
  user_id: string;
  post_id: string;
  created_at: string;
  is_public: boolean;
  post_content: string;
  author: string;
};

type BookmarkedPostData = {
  bookmark: Bookmark;
  post: Post | null;
};

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const timeAgo = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(d);
};

function PostCard({
  post,
  isBookmarked,
  onBookmarkClick,
  isLoading,
}: {
  post: Post;
  isBookmarked: boolean;
  onBookmarkClick: (postId: string) => void;
  isLoading: boolean;
}) {
  const [isBlurred, setIsBlurred] = useState(post.isSensitive);
  const [showImageModal, setShowImageModal] = useState(false);

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-md mb-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-600 text-sm font-semibold">
            {post.username ? post.username.charAt(0).toUpperCase() : 'U'}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-gray-800">
            @{post.username || 'Unknown'}
          </p>
          <p className="text-sm text-gray-500">{timeAgo(post.date)}</p>
        </div>
      </div>

      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.imageUri && (
        <div className="relative mb-4">
          <div className="relative w-full overflow-hidden rounded-lg">
            <img
              src={post.imageUri}
              alt="Post"
              onClick={() => setShowImageModal(true)}
              className={`h-auto w-full cursor-pointer ${
                post.isSensitive && isBlurred ? 'blur-lg' : ''
              } transition-all duration-300`}
            />
          </div>
          {post.isSensitive && isBlurred && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-lg">
              <p className="mb-2 text-center font-medium">
                Post could contain sensitive content
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBlurred(false);
                }}
                className="bg-white/80 px-4 py-2 rounded-md text-sm font-medium text-black hover:bg-gray-50"
              >
                View Image
              </button>
            </div>
          )}
          {!isBlurred && post.isSensitive && (
            <button
              onClick={() => setIsBlurred(true)}
              className="mt-2 bg-gray-600 px-3 py-1 rounded-md text-sm font-medium text-gray-50"
            >
              Hide Image
            </button>
          )}
        </div>
      )}

      {showImageModal && post.imageUri && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-screen p-4">
            <div className="relative max-w-[90vw] max-h-[80vh]">
              <img
                src={post.imageUri}
                alt="Enlarged Post"
                className="h-auto w-full rounded-lg shadow-lg"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <button
              className="absolute top-4 right-4 text-white text-2xl font-semibold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70"
              onClick={() => setShowImageModal(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => onBookmarkClick(post._id)}
          disabled={isLoading}
          className={`flex items-center gap-2 rounded-md px-4 py-2 transition-colors ${
            isBookmarked
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this post'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ${isBookmarked ? 'fill-blue-600' : 'fill-none'}`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <span className="text-sm font-medium">
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function BookmarksTest() {
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarked'>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<BookmarkedPostData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarkStatuses, setBookmarkStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserId(payload.id || payload.user_id || '22222222-2222-2222-2222-222222222222');
        } catch (e) {
          setUserId('22222222-2222-2222-2222-222222222222');
        }
      } else {
        setUserId('22222222-2222-2222-2222-222222222222');
      }
    }
  }, []);

  const checkBookmarkStatusesForPosts = useCallback(
    async (posts: Post[]) => {
      if (!userId) return;
      const statuses: Record<string, boolean> = {};
      await Promise.all(
        posts.map(async (post) => {
          try {
            const response = await fetch(
              `/api/bookmarks/manage?user_id=${encodeURIComponent(userId)}&post_id=${encodeURIComponent(post._id)}`
            );
            if (response.ok) {
              const data = await response.json();
              statuses[post._id] = Array.isArray(data) && data.length > 0;
            }
          } catch (error) {
            console.error(`Error checking bookmark status for post ${post._id}:`, error);
          }
        })
      );
      setBookmarkStatuses(statuses);
    },
    [userId]
  );

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/posts/getPostPage?page=1&postPerPage=10');
        if (response.ok) {
          const posts = await response.json();
          setAllPosts(Array.isArray(posts) ? posts : []);
          if (userId) await checkBookmarkStatusesForPosts(posts);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (activeTab === 'all') fetchAllPosts();
  }, [activeTab, userId, checkBookmarkStatusesForPosts]);

  useEffect(() => {
    const fetchBookmarkedPosts = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const response = await fetch(`/api/bookmarks/manage?user_id=${encodeURIComponent(userId)}`);
        if (response.ok) {
          const bookmarks: Bookmark[] = await response.json();
          const bookmarksArray = Array.isArray(bookmarks) ? bookmarks : [];
          const bookmarkedPostsData = await Promise.all(
            bookmarksArray.map(async (bookmark) => {
              try {
                const postResponse = await fetch(`/api/posts/getPostById/${bookmark.post_id}`);
                if (postResponse.ok) {
                  const post: Post = await postResponse.json();
                  return { bookmark, post };
                }
              } catch (error) {
                console.error(`Error fetching post ${bookmark.post_id}:`, error);
              }
              return {
                bookmark,
                post: {
                  _id: bookmark.post_id,
                  userId: bookmark.user_id,
                  username: bookmark.author,
                  content: bookmark.post_content,
                  imageUri: null,
                  isSensitive: false,
                  hasOffensiveText: false,
                  date: bookmark.created_at,
                },
              };
            })
          );
          setBookmarkedPosts(bookmarkedPostsData);
        }
      } catch (error) {
        console.error('Error fetching bookmarked posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (activeTab === 'bookmarked' && userId) fetchBookmarkedPosts();
  }, [activeTab, userId]);

  const checkBookmarkStatus = useCallback(
    async (postId: string) => {
      if (!userId || !postId) return false;
      try {
        const response = await fetch(
          `/api/bookmarks/manage?user_id=${encodeURIComponent(userId)}&post_id=${encodeURIComponent(postId)}`
        );
        if (response.ok) {
          const data = await response.json();
          const bookmarked = Array.isArray(data) && data.length > 0;
          setBookmarkStatuses((prev) => ({ ...prev, [postId]: bookmarked }));
          return bookmarked;
        }
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
      return false;
    },
    [userId]
  );

  const handleBookmarkClick = async (postId: string) => {
    if (!userId || !postId || isLoading) return;
    const isBookmarked = bookmarkStatuses[postId] || false;
    setIsLoading(true);

    try {
      if (!isBookmarked) {
        const response = await fetch('/api/bookmarks/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            post_id: postId,
            is_public: true,
          }),
        });
        if (response.ok || response.status === 409) {
          setBookmarkStatuses((prev) => ({ ...prev, [postId]: true }));
          if (activeTab === 'bookmarked') {
            const refreshResponse = await fetch(`/api/bookmarks/manage?user_id=${encodeURIComponent(userId)}`);
            if (refreshResponse.ok) {
              const bookmarks: Bookmark[] = await refreshResponse.json();
              const bookmarksArray = Array.isArray(bookmarks) ? bookmarks : [];
              const bookmarkedPostsData = await Promise.all(
                bookmarksArray.map(async (bookmark) => {
                  try {
                    const postResponse = await fetch(`/api/posts/getPostById/${bookmark.post_id}`);
                    if (postResponse.ok) {
                      const post: Post = await postResponse.json();
                      return { bookmark, post };
                    }
                  } catch (error) {
                    console.error(`Error fetching post ${bookmark.post_id}:`, error);
                  }
                  return {
                    bookmark,
                    post: {
                      _id: bookmark.post_id,
                      userId: bookmark.user_id,
                      username: bookmark.author,
                      content: bookmark.post_content,
                      imageUri: null,
                      isSensitive: false,
                      hasOffensiveText: false,
                      date: bookmark.created_at,
                    },
                  };
                })
              );
              setBookmarkedPosts(bookmarkedPostsData);
            }
          }
        } else {
          const data = await response.json().catch(() => ({}));
          alert(`Failed to create bookmark: ${(data as any)?.error || 'Unknown error'}`);
        }
      } else {
        const response = await fetch('/api/bookmarks/manage', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            post_id: postId,
          }),
        });
        if (response.ok) {
          setBookmarkStatuses((prev) => ({ ...prev, [postId]: false }));
          if (activeTab === 'bookmarked') {
            const refreshResponse = await fetch(`/api/bookmarks/manage?user_id=${encodeURIComponent(userId)}`);
            if (refreshResponse.ok) {
              const bookmarks: Bookmark[] = await refreshResponse.json();
              const bookmarksArray = Array.isArray(bookmarks) ? bookmarks : [];
              const bookmarkedPostsData = await Promise.all(
                bookmarksArray.map(async (bookmark) => {
                  try {
                    const postResponse = await fetch(`/api/posts/getPostById/${bookmark.post_id}`);
                    if (postResponse.ok) {
                      const post: Post = await postResponse.json();
                      return { bookmark, post };
                    }
                  } catch (error) {
                    console.error(`Error fetching post ${bookmark.post_id}:`, error);
                  }
                  return {
                    bookmark,
                    post: {
                      _id: bookmark.post_id,
                      userId: bookmark.user_id,
                      username: bookmark.author,
                      content: bookmark.post_content,
                      imageUri: null,
                      isSensitive: false,
                      hasOffensiveText: false,
                      date: bookmark.created_at,
                    },
                  };
                })
              );
              setBookmarkedPosts(bookmarkedPostsData);
            }
          }
        } else {
          const data = await response.json().catch(() => ({}));
          alert(`Failed to delete bookmark: ${(data as any)?.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-lg bg-white p-8 shadow-lg">
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setActiveTab('bookmarked')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'bookmarked'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Bookmarked Posts
          </button>
        </div>
      </div>

      {isLoading && activeTab === 'all' && allPosts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading posts...</p>
        </div>
      )}

      {isLoading && activeTab === 'bookmarked' && bookmarkedPosts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading bookmarked posts...</p>
        </div>
      )}

      {activeTab === 'all' && !isLoading && allPosts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No posts found.</p>
        </div>
      )}

      {activeTab === 'bookmarked' && !isLoading && bookmarkedPosts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No bookmarked posts yet.</p>
        </div>
      )}

      {activeTab === 'all' && (
        <div>
          {allPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              isBookmarked={bookmarkStatuses[post._id] || false}
              onBookmarkClick={handleBookmarkClick}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      {activeTab === 'bookmarked' && (
        <div>
          {bookmarkedPosts.map(({ bookmark, post }) => {
            if (!post) {
              const fallbackPost: Post = {
                _id: bookmark.post_id,
                userId: bookmark.user_id,
                username: bookmark.author,
                content: bookmark.post_content,
                imageUri: null,
                isSensitive: false,
                hasOffensiveText: false,
                date: bookmark.created_at,
              };
              return (
                <PostCard
                  key={bookmark.bookmark_id}
                  post={fallbackPost}
                  isBookmarked
                  onBookmarkClick={handleBookmarkClick}
                  isLoading={isLoading}
                />
              );
            }
            return (
              <PostCard
                key={bookmark.bookmark_id}
                post={post}
                isBookmarked
                onBookmarkClick={handleBookmarkClick}
                isLoading={isLoading}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}