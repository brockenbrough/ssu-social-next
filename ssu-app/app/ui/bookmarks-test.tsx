'use client';

import { useState, useEffect } from 'react';

export default function BookmarksTest() {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [postId] = useState('33333333-3333-3333-3333-333333333333'); // Test post ID

  // Get user ID from localStorage (assuming it's stored there)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to get user ID from token or localStorage
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserId(payload.id || payload.user_id || '22222222-2222-2222-2222-222222222222');
        } catch (e) {
          // Default test user ID if token parsing fails
          setUserId('22222222-2222-2222-2222-222222222222');
        }
      } else {
        // Default test user ID
        setUserId('22222222-2222-2222-2222-222222222222');
      }
    }
  }, []);

  // Check bookmark status on mount
  useEffect(() => {
    if (userId && postId) {
      checkBookmarkStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, postId]);

  const checkBookmarkStatus = async () => {
    if (!userId || !postId) return;

    try {
      const url = `/api/bookmarks/manage?user_id=${encodeURIComponent(userId)}&post_id=${encodeURIComponent(postId)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Failed to check bookmark status:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      const bookmarked = Array.isArray(data) && data.length > 0;
      console.log('Bookmark status check:', { data, bookmarked });
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      // Don't set state on network errors to avoid UI issues
    }
  };

  const handleBookmarkClick = async () => {
    if (!userId || !postId || isLoading) return;

    setIsLoading(true);

    try {
      if (!isBookmarked) {
        // Create bookmark
        const response = await fetch('/api/bookmarks/manage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            post_id: postId,
            is_public: true,
          }),
        });

        let data = {};
        try {
          data = await response.json();
        } catch (e) {
          console.warn('Could not parse response as JSON');
        }
        
        console.log('Create bookmark response:', { status: response.status, statusText: response.statusText, data });
        
        if (response.ok || response.status === 409) {
          setIsBookmarked(true);
          // Re-check status to ensure it's updated
          setTimeout(() => checkBookmarkStatus(), 200);
        } else {
          console.error('Failed to create bookmark:', response.status, data);
          const errorMsg = (data as any)?.error || response.statusText || 'Unknown error';
          alert(`Failed to create bookmark: ${errorMsg}`);
        }
      } else {
        // Delete bookmark
        const response = await fetch('/api/bookmarks/manage', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            post_id: postId,
          }),
        });

        let data = {};
        try {
          data = await response.json();
        } catch (e) {
          console.warn('Could not parse response as JSON');
        }

        console.log('Delete bookmark response:', { status: response.status, statusText: response.statusText, data });

        if (response.ok) {
          setIsBookmarked(false);
          // Re-check status to ensure it's updated
          setTimeout(() => checkBookmarkStatus(), 200);
        } else {
          console.error('Failed to delete bookmark:', response.status, data);
          const errorMsg = (data as any)?.error || response.statusText || 'Unknown error';
          alert(`Failed to delete bookmark: ${errorMsg}`);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error - please check if the server is running';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl rounded-lg bg-white p-8 shadow-lg">
      {/* Test Post */}
      <div className="relative rounded-lg border border-gray-200 bg-white p-8 shadow-md min-h-[300px]">
        <div className="mb-6 pb-16">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-300"></div>
            <div>
              <p className="text-lg font-semibold text-gray-800">Your Mom</p>
              <p className="text-sm text-gray-500">January 1, 0001</p>
            </div>
          </div>
          <p className="text-lg text-gray-700">hello world</p>
        </div>

        {/* Bookmark Icon - Bottom Left */}
        <div className="absolute bottom-4 left-4">
          <button
            onClick={handleBookmarkClick}
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

      {/* Status Info */}
      <div className="mt-6 rounded-md bg-gray-100 p-4">
        <p className="text-sm text-gray-600">
          <strong>Status:</strong>{' '}
          {isBookmarked ? (
            <span className="text-blue-600">Post is bookmarked ✓</span>
          ) : (
            <span className="text-gray-500">Post is not bookmarked</span>
          )}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          User ID: {userId || 'Loading...'} | Post ID: {postId}
        </p>
        {isLoading && (
          <p className="mt-2 text-xs text-blue-600">Processing...</p>
        )}
      </div>
    </div>
  );
}

