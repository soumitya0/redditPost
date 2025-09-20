import React, { useState, FormEvent } from 'react';

interface HeaderProps {
    subreddits: string[];
    currentSubreddit: string;
    onSubredditChange: (subreddit: string) => void;
}

const Header: React.FC<HeaderProps> = ({ subreddits, currentSubreddit, onSubredditChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchTerm.trim().replace(/^r\//, '');
    if (trimmedSearch) {
      onSubredditChange(trimmedSearch);
    }
  };

  const handlePresetClick = (subreddit: string) => {
    setSearchTerm('');
    onSubredditChange(subreddit);
  };

  return (
    <header className="bg-slate-900/70 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
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
              r/{currentSubreddit}
            </h1>
          </div>
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subreddit..."
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
        <nav className="flex items-center space-x-2 overflow-x-auto pb-2">
            {subreddits.map((subreddit) => (
                <button
                    key={subreddit}
                    onClick={() => handlePresetClick(subreddit)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        currentSubreddit === subreddit
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                    aria-pressed={currentSubreddit === subreddit}
                >
                    r/{subreddit}
                </button>
            ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;