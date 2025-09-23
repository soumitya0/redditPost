
import React, { useState, useEffect, useCallback } from 'react';
import { RedditPost } from './types';
import PostCard from './components/PostCard';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';

const SUBREDDITS = ['IndianCivicFails', 'PublicFreakoutDesi', 'roadrage', 'dashcamgifs'];

const App: React.FC = () => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subreddit, setSubreddit] = useState<string>(SUBREDDITS[0]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=50`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Subreddit 'r/${subreddit}' not found or is private.`);
        }
        throw new Error(`Failed to fetch: ${response.statusText} (${response.status})`);
      }
      const data = await response.json();
      const fetchedPosts = data.data.children.map((child: any) => child.data);
      setPosts(fetchedPosts);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, [subreddit]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSubredditChange = (newSubreddit: string) => {
    setPosts([]); // Clear posts to show loading spinner immediately
    setSubreddit(newSubreddit);
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