import React, { useState } from 'react';
import { RedditPost } from '../types';
import YouTubeModal from './YouTubeModal';

interface PostCardProps {
  post: RedditPost;
}

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);

  const imageUrl = post.preview?.images[0]?.resolutions[post.preview.images[0].resolutions.length - 1]?.url.replace(/&amp;/g, '&');
  const videoUrl = post.is_video && post.media?.reddit_video ? post.media.reddit_video.fallback_url : null;
  const downloadableUrl = videoUrl || imageUrl;

  const handleDownload = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!downloadableUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(downloadableUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch media. Status: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const urlPath = new URL(downloadableUrl).pathname;
      const fileExtension = urlPath.substring(urlPath.lastIndexOf('.')) || (videoUrl ? '.mp4' : '.jpg');
      a.download = `${post.id}${fileExtension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Could not download automatically. The media will open in a new tab for you to save manually.");
      window.open(downloadableUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleOpenYouTubeModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoUrl) {
      setIsYouTubeModalOpen(true);
    }
  };

  const renderMedia = () => {
    if (post.is_video && post.media?.reddit_video) {
        return (
            <video 
                className="w-full h-full object-cover"
                poster={post.thumbnail}
                controls
                preload="metadata"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <source src={post.media.reddit_video.fallback_url} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        );
    }
    
    if (post.post_hint === 'image' && imageUrl) {
      return <img src={imageUrl} alt={post.title} className="w-full h-full object-cover" loading="lazy" />;
    }

    if(post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default') {
      return <img src={post.thumbnail} alt="thumbnail" className="w-full h-full object-cover" loading="lazy" />;
    }

    return (
      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
        </svg>
      </div>
    );
  };

  return (
    <>
      <a
        href={`https://www.reddit.com${post.permalink}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1 transition-all duration-300 group border border-slate-700 flex flex-col"
      >
        <div className="relative w-full aspect-video bg-slate-900">
          {renderMedia()}
          <div className="absolute top-2 right-2 bg-slate-900/70 text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            u/{post.author}
          </div>
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-base font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors duration-300 mb-2 leading-tight line-clamp-2 text-ellipsis overflow-hidden">
            {post.title}
          </h3>
          <div className="flex items-center justify-between text-sm text-slate-400 mt-auto">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span>{formatNumber(post.score)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{formatNumber(post.num_comments)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {videoUrl && (
                <button
                  onClick={handleOpenYouTubeModal}
                  className="flex items-center justify-center w-10 h-8 rounded-md bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition-all"
                  aria-label="Prepare for YouTube Upload"
                  title="Generate title & description for YouTube"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" />
                  </svg>
                </button>
              )}
              {downloadableUrl && (
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center justify-center w-10 h-8 rounded-md bg-[#4FB7B3] text-white font-semibold text-xs hover:bg-opacity-90 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
                    aria-label="Download media"
                    title="Download media"
                >
                    {isDownloading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    )}
                </button>
              )}
            </div>
          </div>
        </div>
      </a>
      {isYouTubeModalOpen && videoUrl && (
        <YouTubeModal
          post={post}
          onClose={() => setIsYouTubeModalOpen(false)}
          onConfirm={handleDownload}
          videoUrl={videoUrl}
        />
      )}
    </>
  );
};

export default PostCard;
