import React, { useState, FormEvent } from 'react';

interface SubredditGroup {
  title: string;
  channels: string[];
}

interface HeaderProps {
    subredditGroups: SubredditGroup[];
    currentSubreddit: string;
    onSubredditChange: (subreddit: string) => void;
    currentSort: string;
    onSortChange: (sort: string) => void;
    activeSearchQuery: string;
    onGlobalSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    subredditGroups, 
    currentSubreddit, 
    onSubredditChange, 
    currentSort, 
    onSortChange,
    activeSearchQuery,
    onGlobalSearch
}) => {
  const [subredditSearchTerm, setSubredditSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    // By default, expand the first group and collapse the others.
    const initialState: Record<string, boolean> = {};
    if (subredditGroups.length > 0) {
      initialState[subredditGroups[0].title] = true;
    }
    subredditGroups.slice(1).forEach(group => {
      initialState[group.title] = false;
    });
    return initialState;
  });

  const BROWSE_SORTS = ['hot', 'new', 'top', 'videos'];
  const SEARCH_SORTS = ['relevance', 'hot', 'top', 'new', 'comments'];
  const SORTS = activeSearchQuery ? SEARCH_SORTS : BROWSE_SORTS;

  const handleSubredditSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedSearch = subredditSearchTerm.trim().replace(/^r\//, '');
    if (trimmedSearch) {
      onSubredditChange(trimmedSearch);
      setSubredditSearchTerm('');
    }
  };
  
  const handleGlobalSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedSearch = globalSearchTerm.trim();
    if (trimmedSearch) {
      onGlobalSearch(trimmedSearch);
    }
  };

  const handlePresetClick = (subreddit: string) => {
    setSubredditSearchTerm('');
    setGlobalSearchTerm('');
    onSubredditChange(subreddit);
  };

  const isSubredditActive = (subreddit: string) => {
      return currentSubreddit === subreddit && !activeSearchQuery;
  }
  
  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <header className="bg-slate-900/70 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-700">
      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-indigo-400 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight truncate">
              {activeSearchQuery ? `Search: "${activeSearchQuery}"` : `r/${currentSubreddit}`}
            </h1>
          </div>
          <form onSubmit={handleSubredditSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              value={subredditSearchTerm}
              onChange={(e) => setSubredditSearchTerm(e.target.value)}
              placeholder="Go to subreddit..."
              className="bg-slate-800 border border-slate-700 rounded-full w-full py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-colors"
              aria-label="Search for a subreddit"
            />
            <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-indigo-400" aria-label="Search">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
        <form onSubmit={handleGlobalSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              placeholder="Search all of Reddit for posts..."
              className="bg-slate-800 border border-slate-700 rounded-full w-full py-3 pl-5 pr-12 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-colors"
              aria-label="Search all of Reddit"
            />
            <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-400" aria-label="Global Search">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        <div className="space-y-4">
          {/* Subreddit Groups */}
          <div className="space-y-1">
            {subredditGroups.map((group) => {
              const isExpanded = !!expandedGroups[group.title];
              return (
              <div key={group.title}>
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex justify-between items-center w-full px-2 py-1.5 rounded-md hover:bg-slate-800 transition-colors group"
                  aria-expanded={isExpanded}
                  aria-controls={`group-${group.title.replace(/\s+/g, '-')}`}
                >
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider group-hover:text-slate-200 transition-colors">{group.title}</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                    id={`group-${group.title.replace(/\s+/g, '-')}`}
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}
                >
                    <nav className="flex items-center gap-2 flex-wrap pt-2 pb-2 pl-2">
                    {group.channels.map((subreddit) => (
                        <button
                        key={subreddit}
                        onClick={() => handlePresetClick(subreddit)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                            isSubredditActive(subreddit)
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                        aria-pressed={isSubredditActive(subreddit)}
                        >
                        r/{subreddit}
                        </button>
                    ))}
                    </nav>
                </div>
              </div>
            )})}
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-700 pt-3">
            <span className="text-sm font-semibold text-slate-400">Sort by:</span>
            <div className="flex items-center flex-wrap gap-2">
              {SORTS.map((sort) => (
                <button
                  key={sort}
                  onClick={() => onSortChange(sort)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap capitalize ${
                    currentSort === sort
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                  aria-pressed={currentSort === sort}
                >
                  {sort}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;