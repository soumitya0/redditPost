
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RedditPost } from './types';
import PostCard from './components/PostCard';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';

const SUBREDDIT_GROUPS = [
  {
    title: 'Japanese Culture & Life',
    channels: ['newsokur', 'japanlife', 'japanpics', 'anime', 'manga', 'JapaneseFood', 'ramen', 'ghibli', 'tokyo']
  },
  {
    title: 'Travel',
    channels: ['roadtrip', 'SoloTravel_India', 'hiking', 'backpacking', 'camping', 'travel', 'Survival', 'coloradohikers', 'pics']
  },
  {
    title: 'Animals',
    channels: ['cats', 'aww', 'Catswhoyell', 'pandas', 'bear', 'BearCubGIFs', 'bearsdoinghumanthings', 'Animal', 'Animals', 'AnimalsBeingAnimals', 'AnimalsOnReddit', 'NatureIsFuckingLit']
  },
  {
    title: 'Food',
    channels: ['StupidFood', 'KoreanFood', 'chinesefood']
  },
  {
    title: 'Gaming',
    channels: ['gaming', 'Games', 'pcgaming', 'playstation', 'xbox', 'nintendo']
  },
  {
    title: 'Creative & Amazing',
    channels: ['BeAmazed', 'nextfuckinglevel', 'SipsTea']
  },
  {
    title: 'Calm Night',
    channels: ['TheNightFeeling']
  },
  {
    title: 'Automotive',
    channels: ['carspotting', 'spotted', 'supercars', 'Justrolledintotheshop', 'motorcycles', 'MotorcycleMechanics', 'AwesomeCarMods', 'MechanicAdvice']
  },
  {
    title: 'Military',
    channels: ['TankPorn', 'WarplanePorn', 'WarshipPorn', 'submarines']
  },
  {
    title: 'AI',
    channels: ['aivideo', 'aiecosystem', 'Fauxmoi', 'ChatGPT', 'AIGrinding', 'SoraAi']
  },
  {
    title: 'Watches',
    channels: ['Repdesignerwatch1', 'RepWatchForum', 'Watches', 'repwatchbuysell', 'Makera']
  }
];


const App: React.FC = () => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subreddit, setSubreddit] = useState<string>(SUBREDDIT_GROUPS[0].channels[0]);
  const [sort, setSort] = useState<string>('hot');
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [activePostUrl, setActivePostUrl] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPosts = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setLoading(true);
    setError(null);
    setPosts([]); // Clear posts for new fetch

    try {
      // Logic for fetching a single post by its URL
      if (activePostUrl) {
        if (!/reddit\.com\/r\//.test(activePostUrl)) {
          throw new Error("This doesn't look like a valid Reddit post URL.");
        }
        const cleanUrl = activePostUrl.split('?')[0].replace(/\/$/, '');
        const url = `${cleanUrl}.json?raw_json=1`;
        
        const response = await fetch(url, { signal, cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`Could not fetch the post from the URL. Please check if it's a valid and public Reddit post URL.`);
        }
        
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse JSON response from Reddit:", parseError, "\nResponse text:", responseText);
          throw new Error("Received an invalid response from Reddit. The API might be temporarily unavailable or blocking requests.");
        }
        
        if (!Array.isArray(data) || !data[0]?.data?.children?.[0]?.data) {
          throw new Error("The provided URL does not point to a valid Reddit post.");
        }
        const fetchedPost = data[0].data.children[0].data;
        setPosts([fetchedPost]);
        setSubreddit(fetchedPost.subreddit);
        return; // Early exit after processing URL
      }

      // Special logic for 'engagement' sort: fetch pages until we have 50 videos > 1.5k upvotes & 50 comments
      if (sort === 'engagement') {
          let collectedPosts: RedditPost[] = [];
          let after: string | null = null;
          const targetCount = 50;
          const minScore = 1500;
          const minComments = 50;
          const maxPagesToFetch = 5; // Safety break: fetch up to 5 * 100 = 500 posts max.
          let pagesFetched = 0;

          while (collectedPosts.length < targetCount && pagesFetched < maxPagesToFetch && !signal.aborted) {
              pagesFetched++;
              const afterParam = after ? `&after=${after}` : '';
              const limitParam = `&limit=100`;

              let fetchUrl: string;
              if (activeSearchQuery) {
                  // Engagement sort within a search query
                  fetchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(activeSearchQuery)}&sort=top&raw_json=1${limitParam}${afterParam}`;
              } else {
                  // Engagement sort within a subreddit
                  fetchUrl = `https://www.reddit.com/r/${subreddit}/top.json?t=all&raw_json=1${limitParam}${afterParam}`;
              }

              const response = await fetch(fetchUrl, { signal, cache: 'no-cache' });
              if (!response.ok) {
                  if (response.status === 404 && !activeSearchQuery) {
                      throw new Error(`Subreddit 'r/${subreddit}' not found or is private.`);
                  }
                  throw new Error(`Failed to fetch from Reddit (page ${pagesFetched}): ${response.statusText}`);
              }
              
              const data = await response.json();
              if (!data?.data?.children || data.data.children.length === 0) {
                  break; // No more posts to fetch
              }

              const qualifyingPosts: RedditPost[] = data.data.children
                  .map((child: any) => child.data)
                  .filter((p: RedditPost) => p.is_video && p.score > minScore && p.num_comments > minComments);

              collectedPosts.push(...qualifyingPosts);

              after = data.data.after;
              if (!after) {
                  break; // Reached the last page
              }
          }

          if (signal.aborted) {
            console.log('Fetch aborted during engagement post collection.');
            return;
          }
          
          setPosts(collectedPosts.slice(0, targetCount));

      } else { // Standard logic for all other sort types
          let url = '';
          const apiSort = sort;

          if (activeSearchQuery) {
              if (sort === 'videos') {
                  const videoQuery = `${activeSearchQuery} site:v.redd.it`;
                  url = `https://www.reddit.com/search.json?q=${encodeURIComponent(videoQuery)}&sort=relevance&limit=50&raw_json=1`;
              } else {
                  url = `https://www.reddit.com/search.json?q=${encodeURIComponent(activeSearchQuery)}&sort=${apiSort}&limit=50&raw_json=1`;
              }
          } else if (sort === 'videos') {
              url = `https://www.reddit.com/r/${subreddit}/search.json?q=site%3Av.redd.it&restrict_sr=on&sort=new&limit=50&raw_json=1`;
          } else {
              url = `https://www.reddit.com/r/${subreddit}/${apiSort}.json?limit=50&raw_json=1`;
          }

          const response = await fetch(url, { 
              signal,
              cache: 'no-cache'
          });

          if (!response.ok) {
              if (response.status === 404 && !activeSearchQuery && !activePostUrl) {
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
          let fetchedPosts = data.data.children.map((child: any) => child.data);
          setPosts(fetchedPosts);
      }
    } catch (e) {
      if (e instanceof Error) {
        if (e.name === 'AbortError') {
          console.log('Fetch aborted.');
          return;
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
  }, [subreddit, sort, activeSearchQuery, activePostUrl]);

  useEffect(() => {
    fetchPosts();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchPosts]);

  const handleSubredditChange = (newSubreddit: string) => {
    setActiveSearchQuery('');
    setActivePostUrl('');
    setSubreddit(newSubreddit);
    // When clearing search, ensure sort is valid for subreddit browsing
    if (sort === 'relevance' || sort === 'comments') {
        setSort('hot');
    }
  };
  
  const handleSortChange = (newSort: string) => {
    setSort(newSort);
  };

  const handleGlobalSearch = (query: string) => {
    setActivePostUrl('');
    setActiveSearchQuery(query);
    setSubreddit(''); // Clear subreddit context for global search
  };
  
  const handleUrlSearch = (url: string) => {
    setActiveSearchQuery('');
    setSubreddit('');
    setActivePostUrl(url);
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
      let message: string;
      if (sort === 'engagement') {
        const criteria = "with over 1,500 upvotes and 50 comments";
        if (activeSearchQuery) {
          message = `Could not find enough videos matching "${activeSearchQuery}" ${criteria}.`;
        } else {
          message = `Could not find enough videos in r/${subreddit} ${criteria}. Try another subreddit.`;
        }
      } else if (activeSearchQuery) {
        message = `No posts found for your search: "${activeSearchQuery}"`;
      } else if (activePostUrl) {
        message = `Could not load the post from the provided URL.`;
      } else {
        message = `No posts found in r/${subreddit}.`;
      }
      return <p className="text-center text-slate-400">{message}</p>;
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
        subredditGroups={SUBREDDIT_GROUPS}
        currentSubreddit={subreddit}
        onSubredditChange={handleSubredditChange}
        currentSort={sort}
        onSortChange={handleSortChange}
        activeSearchQuery={activeSearchQuery}
        onGlobalSearch={handleGlobalSearch}
        activePostUrl={activePostUrl}
        onUrlSearch={handleUrlSearch}
      />
      <main className="container mx-auto p-4 sm:p-6">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;