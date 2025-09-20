import React, { useState, useEffect, useCallback } from 'react';
import { RedditPost } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import LoadingSpinner from './LoadingSpinner';

interface YouTubeModalProps {
  post: RedditPost;
  videoUrl: string;
  onClose: () => void;
  onConfirm: () => void;
}

interface AiContent {
    title: string;
    description: string;
    tags: string[];
}

const YouTubeModal: React.FC<YouTubeModalProps> = ({ post, videoUrl, onClose, onConfirm }) => {
  const [aiContent, setAiContent] = useState<AiContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Based on this Reddit post title, generate a catchy YouTube video title, a compelling description, and 5 relevant hashtags.
        Reddit Title: "${post.title}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "A catchy, SEO-friendly title for the YouTube video, under 100 characters."
              },
              description: {
                type: Type.STRING,
                description: "A detailed description for the YouTube video, including a reference to the original Reddit post."
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 5 relevant hashtags without the '#' symbol."
              }
            },
            required: ["title", "description", "tags"]
          }
        }
      });
      
      const jsonResponse = JSON.parse(response.text);
      setAiContent(jsonResponse);

    } catch (err) {
      console.error("Gemini API call failed:", err);
      setError("Failed to generate AI content. You can still proceed manually.");
      // Provide default content on failure
      setAiContent({
        title: post.title,
        description: `Original post: https://www.reddit.com${post.permalink}\nPosted by: u/${post.author}`,
        tags: ['reddit', post.subreddit]
      });
    } finally {
      setIsLoading(false);
    }
  }, [post]);

  useEffect(() => {
    generateDetails();
  }, [generateDetails]);

  const handleConfirm = async () => {
    if (!aiContent) return;

    const fullDescription = `${aiContent.description}\n\nHashtags:\n${aiContent.tags.map(t => `#${t}`).join(' ')}`;
    const textToCopy = `Title: ${aiContent.title}\n\nDescription:\n${fullDescription}`;
    
    try {
        await navigator.clipboard.writeText(textToCopy);
    } catch(err) {
        console.error("Failed to copy to clipboard", err);
        alert("Could not copy details to clipboard automatically.");
    }

    onConfirm(); // This will trigger the download
    window.open('https://www.youtube.com/upload', '_blank', 'noopener,noreferrer');
    onClose();
  };
  
  const handleContentChange = (field: keyof AiContent, value: string | string[]) => {
      setAiContent(prev => prev ? {...prev, [field]: value} : null);
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" /></svg>
            <span>AI-Powered YouTube Details</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto space-y-4">
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner />
                </div>
            ) : error ? (
                <div className="text-center text-yellow-400 bg-yellow-900/20 p-4 rounded-lg">
                    <p className="font-bold text-lg">AI Generation Failed</p>
                    <p>{error}</p>
                </div>
            ) : null}
            {aiContent && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="yt-title" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                        <input type="text" id="yt-title" value={aiContent.title} onChange={(e) => handleContentChange('title', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                        <label htmlFor="yt-desc" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea id="yt-desc" rows={6} value={aiContent.description} onChange={(e) => handleContentChange('description', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-colors"></textarea>
                    </div>
                    <div>
                        <label htmlFor="yt-tags" className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
                        <input type="text" id="yt-tags" value={aiContent.tags.join(', ')} onChange={(e) => handleContentChange('tags', e.target.value.split(',').map(t => t.trim()))} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                </div>
            )}
        </div>
        <footer className="p-4 border-t border-slate-700 flex justify-end items-center space-x-3 flex-shrink-0 bg-slate-800/50 rounded-b-xl">
          <p className="text-xs text-slate-500 mr-auto">Review details before continuing.</p>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-slate-600 hover:bg-slate-500 rounded-md transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={!aiContent} className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-400">Copy & Continue to YouTube</button>
        </footer>
      </div>
    </div>
  );
};

export default YouTubeModal;
