
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RedditPost } from './types';
import PostCard from './components/PostCard';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';

const SUBREDDITS = ['IndianCivicFails', 'PublicFreakoutDesi', 'NewDelhi', 'dashcamgifs'];

const App: React.FC = () => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subreddit, setSubreddit] = useState<string>(SUBREDDITS[0]);
  const [sort, setSort] = useState<string>('new');
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPosts = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setLoading(true);
    setError(null);
    setPosts([]); // Clear posts for new fetch

    try {
      const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=50&raw_json=1`;
      const response = await fetch(url, { 
        signal,
        cache: 'no-cache'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Subreddit 'r/${subreddit}' not found or is private.`);
        }
        throw new Error(`Failed to fetch from Reddit: ${response.statusText} (${response.status})`);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON response from Reddit:", parseError, "\nResponse text:", responseText);
        throw new Error("Received an invalid response from Reddit. The API might be temporarily unavailable or blocking requests.");
      }

      if (!data?.data?.children) {
        console.error("Unexpected JSON structure from Reddit API:", data);
        throw new Error("Received an unexpected data format from Reddit.");
      }

      const fetchedPosts = data.data.children.map((child: any) => child.data);
      setPosts(fetchedPosts);
    } catch (e) {
      if (e instanceof Error) {
        if (e.name === 'AbortError') {
          console.log('Fetch aborted.');
          return; // Don't set error for aborted requests
        }
        setError(e.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [subreddit, sort]);

  useEffect(() => {
    fetchPosts();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchPosts]);

  const handleSubredditChange = (newSubreddit: string) => {
    setSubreddit(newSubreddit);
  };
  
  const handleSortChange = (newSort: string) => {
    setSort(newSort);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
          <p className="font-bold text-lg">Oops! Something went wrong.</p>
          <p>{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (posts.length === 0) {
      return <p className="text-center text-slate-400">No posts found in r/{subreddit}.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <Header
        subreddits={SUBREDDITS}
        currentSubreddit={subreddit}
        onSubredditChange={handleSubredditChange}
        currentSort={sort}
        onSortChange={handleSortChange}
      />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>Built for viewing Reddit. Not affiliated with Reddit.</p>
      </footer>
    </div>
  );
};

export default App;
