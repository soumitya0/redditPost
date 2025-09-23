import React, { useState, useEffect, useRef } from 'react';
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
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let hls: any | null = null;
    
    // Logic to attach HLS.js player for videos with sound
    if (post.is_video && post.media?.reddit_video && !post.media.reddit_video.is_gif && videoRef.current) {
      const video = videoRef.current;
      const hlsUrl = post.media.reddit_video.hls_url;
      const fallbackUrl = post.media.reddit_video.fallback_url;
      const Hls = (window as any).Hls;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (e.g., Safari)
        video.src = hlsUrl;
      } else if (Hls && Hls.isSupported()) {
        // Use hls.js for other browsers to enable audio
        hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
      } else {
        // Fallback for browsers with no HLS support at all (will likely be without audio)
        console.error("HLS not supported, falling back to video without audio.");
        video.src = fallbackUrl;
      }
    }
    
    // Cleanup function to destroy hls instance when component unmounts
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [post]);


  const resolutions = post.preview?.images[0]?.resolutions;
  const lastResolution = resolutions && resolutions.length > 0 ? resolutions[resolutions.length - 1] : null;
  const imageUrl = lastResolution?.url?.replace(/&amp;/g, '&');
  
  const videoUrl = post.is_video && post.media?.reddit_video ? post.media.reddit_video.fallback_url : null;
  const downloadableUrl = videoUrl || imageUrl;

  const proceedWithVideoDownload = async () => {
    setShowDownloadConfirm(false);
    if (!videoUrl) return;

    const redditPostUrl = `https://www.reddit.com${post.permalink}`;
    const dashUrl = post.media?.reddit_video?.dash_url;
    
    // Attempt to parse DASH manifest for high-quality, reliable download with audio
    if (dashUrl) {
      try {
        const response = await fetch(dashUrl);
        const manifestText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(manifestText, "application/xml");

        // Find the highest quality video stream by bandwidth
        const videoSet = Array.from(xmlDoc.getElementsByTagName('AdaptationSet')).find(set => set.getAttribute('contentType') === 'video/mp4');
        const videoReps = videoSet ? Array.from(videoSet.getElementsByTagName('Representation')) : [];
        videoReps.sort((a, b) => parseInt(b.getAttribute('bandwidth') || '0', 10) - parseInt(a.getAttribute('bandwidth') || '0', 10));
        const videoBaseUrl = videoReps.length > 0 ? videoReps[0].getElementsByTagName('BaseURL')[0]?.textContent : null;

        // Find the audio stream
        const audioSet = Array.from(xmlDoc.getElementsByTagName('AdaptationSet')).find(set => set.getAttribute('contentType') === 'audio/mp4');
        const audioBaseUrl = audioSet ? audioSet.getElementsByTagName('BaseURL')[0]?.textContent : null;

        if (videoBaseUrl && audioBaseUrl) {
          const baseUrlPath = dashUrl.substring(0, dashUrl.lastIndexOf('/') + 1);
          const fullVideoUrl = baseUrlPath + videoBaseUrl;
          const fullAudioUrl = baseUrlPath + audioBaseUrl;
          
          // Use redditsave.com as it can take direct audio/video stream URLs for merging
          const downloaderServiceUrl = `https://sd.redditsave.com/download.php?permalink=${encodeURIComponent(redditPostUrl)}&video_url=${encodeURIComponent(fullVideoUrl)}&audio_url=${encodeURIComponent(fullAudioUrl)}`;
          window.open(downloaderServiceUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      } catch (error) {
        console.error("Failed to parse DASH manifest, using fallback downloader:", error);
      }
    }

    // Fallback method if DASH parsing fails or is not available
    const fallbackDownloaderUrl = `https://rapidsave.com/?url=${encodeURIComponent(redditPostUrl)}`;
    window.open(fallbackDownloaderUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!downloadableUrl) return;

    // For videos, show a confirmation modal before redirecting
    if (videoUrl) {
      setShowDownloadConfirm(true);
      return;
    }

    // For images, use the original direct download logic.
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
      const fileExtension = urlPath.substring(urlPath.lastIndexOf('.')) || '.jpg';
      a.download = `${post.id}${fileExtension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Could not download automatically. The media will open in a new tab for you to save manually.");
      window.open(downloadableUrl, '_blank');
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
        const isGif = post.media.reddit_video.is_gif;
        
        if (isGif) {
          // Render GIFs as looping, muted videos without controls
          return (
            <div className="relative w-full h-full">
              <video 
                className="w-full h-full object-cover bg-black"
                poster={post.thumbnail}
                preload="metadata"
                loop
                muted
                autoPlay
                playsInline
                src={post.media.reddit_video.fallback_url}
              />
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold py-1 px-2 rounded">
                GIF
              </div>
            </div>
          );
        }
        
        // For actual videos, use the ref and useEffect will attach the HLS source with audio
        return (
          <video 
            ref={videoRef}
            className="w-full h-full object-cover bg-black"
            poster={post.thumbnail}
            controls
            preload="metadata"
            playsInline
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
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

  const DownloadConfirmationModal = () => {
    if (!showDownloadConfirm) return null;

    return (
      <div
        className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4"
        onClick={() => setShowDownloadConfirm(false)}
        aria-modal="true"
        role="dialog"
      >
        <div
          className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Video Download Notice</span>
            </h2>
          </header>
          <div className="p-6 space-y-3">
            <p className="text-slate-300">To download this video with sound, we need to open a specialized download service in a new tab.</p>
            <p className="text-slate-400 text-sm">This is because Reddit provides video and audio as separate files, and this service will combine them for you.</p>
          </div>
          <footer className="p-4 bg-slate-900/50 rounded-b-xl flex justify-end items-center space-x-3">
            <button onClick={() => setShowDownloadConfirm(false)} className="px-4 py-2 text-sm font-semibold bg-slate-600 hover:bg-slate-500 rounded-md transition-colors">
              Cancel
            </button>
            <button onClick={proceedWithVideoDownload} className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors">
              Continue
            </button>
          </footer>
        </div>
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
                    className="flex items-center justify-center w-10 h-8 rounded-md bg-[#4FB7B3] text-white font-semibold text-xs hover:bg-opacity-90 transition-all"
                    aria-label="Download media"
                    title="Download media"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </a>
      <DownloadConfirmationModal />
      {isYouTubeModalOpen && videoUrl && (
        <YouTubeModal
          post={post}
          onClose={() => setIsYouTubeModalOpen(false)}
          onConfirm={() => handleDownload()}
          videoUrl={videoUrl}
        />
      )}
    </>
  );
};

export default PostCard;