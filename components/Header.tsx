
import React, { useState, FormEvent, useEffect } from 'react';

interface SubredditGroup {
  title: string;
  channels: string[];
}

type SearchMode = 'subreddit' | 'keyword' | 'url';

interface HeaderProps {
    subredditGroups: SubredditGroup[];
    currentSubreddit: string;
    onSubredditChange: (subreddit: string) => void;
    currentSort: string;
    onSortChange: (sort: string) => void;
    activeSearchQuery: string;
    onGlobalSearch: (query: string) => void;
    activePostUrl: string;
    onUrlSearch: (url: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    subredditGroups, 
    currentSubreddit, 
    onSubredditChange, 
    currentSort, 
    onSortChange,
    activeSearchQuery,
    onGlobalSearch,
    activePostUrl,
    onUrlSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('subreddit');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    if (subredditGroups.length > 0) {
      initialState[subredditGroups[0].title] = true;
    }
    subredditGroups.slice(1).forEach(group => {
      initialState[group.title] = false;
    });
    return initialState;
  });
  const [isGloballyExpanded, setIsGloballyExpanded] = useState(true);

  const BROWSE_SORTS = ['hot', 'new', 'top', 'engagement', 'videos'];
  const SEARCH_SORTS = ['relevance', 'hot', 'top', 'new', 'comments', 'engagement', 'videos'];
  const SORTS = activeSearchQuery ? SEARCH_SORTS : BROWSE_SORTS;

  useEffect(() => {
    if (activePostUrl) {
      setSearchMode('url');
    } else if (activeSearchQuery) {
      setSearchMode('keyword');
    } else {
      setSearchMode('subreddit');
    }
  }, [activePostUrl, activeSearchQuery]);


  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) return;

    switch (searchMode) {
        case 'subreddit':
            onSubredditChange(trimmedSearch.replace(/^r\//, ''));
            break;
        case 'keyword':
            onGlobalSearch(trimmedSearch);
            break;
        case 'url':
            onUrlSearch(trimmedSearch);
            break;
    }
    setSearchTerm('');
  };
  
  const handlePresetClick = (subreddit: string) => {
    setSearchTerm('');
    setSearchMode('subreddit');
    onSubredditChange(subreddit);
  };

  const isSubredditActive = (subreddit: string) => {
      return currentSubreddit === subreddit && !activeSearchQuery && !activePostUrl;
  }
  
  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };
  
  const toggleGlobalCollapse = () => setIsGloballyExpanded(prev => !prev);
  
  const getHeaderText = () => {
    if (activeSearchQuery) {
        return `Search: "${activeSearchQuery}"`;
    }
    if (activePostUrl) {
        return currentSubreddit ? `Viewing r/${currentSubreddit}` : 'Loading Post from URL...';
    }
    if (!currentSubreddit) {
        return 'Reddit Viewer';
    }
    return `r/${currentSubreddit}`;
  };

  const placeholders: Record<SearchMode, string> = {
    subreddit: 'Go to subreddit...',
    keyword: 'Search all of Reddit for posts...',
    url: 'Paste a Reddit post URL...',
  };

  // FIX: Resolve "Cannot find namespace 'JSX'" error by using `React.ReactElement` instead of `JSX.Element`.
  // `React.ReactElement` is functionally equivalent and correctly scoped under the `React` import, which resolves the namespace issue.
  const searchModeConfig: { id: SearchMode; label: string; icon: React.ReactElement }[] = [
    { id: 'subreddit', label: 'Channel', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" /></svg> },
    { id: 'keyword', label: 'Search', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
    { id: 'url', label: 'From URL', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg> }
  ];


  return (
    <header className="bg-slate-900/70 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
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
                  {getHeaderText()}
                </h1>
            </div>
             <button
                onClick={toggleGlobalCollapse}
                className="p-2 rounded-full hover:bg-slate-800 transition-colors flex items-center gap-2"
                aria-expanded={isGloballyExpanded}
                aria-controls="global-controls-panel"
                title={isGloballyExpanded ? 'Collapse Controls' : 'Expand Controls'}
            >
                <span className="text-sm font-semibold text-slate-400 hidden sm:inline">{isGloballyExpanded ? "Hide" : "Show"} Controls</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isGloballyExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>

        <div
          id="global-controls-panel"
          className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isGloballyExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="pt-4 space-y-4">
              <div className="p-1 bg-slate-800 rounded-full flex items-center space-x-1 max-w-sm">
                {searchModeConfig.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setSearchMode(id)}
                    className={`w-full flex items-center justify-center text-sm font-semibold py-1.5 px-3 rounded-full transition-colors ${
                      searchMode === id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={placeholders[searchMode]}
                  className="bg-slate-800 border border-slate-700 rounded-full w-full py-2.5 pl-5 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-all"
                  aria-label="Search input"
                />
                <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-400" aria-label="Submit search">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </form>
              
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
                
              {!activePostUrl && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
