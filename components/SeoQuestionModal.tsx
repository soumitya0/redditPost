
import React, { useState, useEffect, useCallback } from 'react';
import { RedditPost } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import LoadingSpinner from './LoadingSpinner';

interface SeoQuestionModalProps {
  post: RedditPost;
  onClose: () => void;
}

interface SeoContent {
    shortsTitle: string;
    searchQuestion: string;
    suggestedHashtags: string[];
}

const SeoQuestionModal: React.FC<SeoQuestionModalProps> = ({ post, onClose }) => {
  const [seoContent, setSeoContent] = useState<SeoContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<Record<string, string>>({});

  const generateSeoQuestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a world-class YouTube Growth Hacker. Your mission is to create a comprehensive "YouTube Growth Kit" based on a video's details. This kit must contain assets optimized for all major YouTube traffic sources: the Shorts feed, YouTube Search, and Browse/Channel pages.

**Analyze the following video details:**
*   **Subreddit:** r/${post.subreddit}
*   **Original Title:** "${post.title}"

**Your task is to generate a JSON object with three distinct, optimized assets:**

1.  **\`shortsTitle\` (For the Shorts Feed):**
    *   **Goal:** Stop the scroll. Maximize immediate engagement.
    *   **Constraint:** A very short, punchy, curiosity-driven title. **Strictly under 40 characters.**
    *   **Example:** For a video of a cat falling, "Wait for the clumsy landing..." is better than "Funny cat falls off a table".

2.  **\`searchQuestion\` (For YouTube Search):**
    *   **Goal:** Rank in search results for high-intent queries.
    *   **Constraint:** A long-tail SEO question. **Strictly and EXACTLY 8 words long.** Must start with "Why," "How," "What," or a similar interrogative word.
    *   **Example:** For a meowing cheetah, "Why does that wild cheetah meow like a housecat?" targets a specific, valuable search term.

3.  **\`suggestedHashtags\` (For Browse & Categorization):**
    *   **Goal:** Help YouTube's algorithm understand and categorize the video.
    *   **Constraint:** An array of 3 to 5 relevant, lowercase hashtags (as strings, without the '#'). **The first hashtag MUST be "shorts".**

Generate this complete YouTube Growth Kit based on the provided video details.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shortsTitle: {
                type: Type.STRING,
                description: "A very short, punchy title for YouTube Shorts, under 40 characters."
              },
              searchQuestion: {
                type: Type.STRING,
                description: "The generated SEO-optimized question, which must be exactly 8 words long."
              },
              suggestedHashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 3-5 relevant, lowercase hashtags, with 'shorts' being the first one."
              }
            },
            required: ["shortsTitle", "searchQuestion", "suggestedHashtags"]
          }
        }
      });
      
      const jsonResponse = JSON.parse(response.text);
      setSeoContent(jsonResponse);

    } catch (err) {
      console.error("Gemini API call for SEO kit failed:", err);
      setError("Failed to generate the YouTube Growth Kit. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [post]);

  useEffect(() => {
    generateSeoQuestion();
  }, [generateSeoQuestion]);

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus({ [type]: 'Copied!' });
      setTimeout(() => setCopyStatus({}), 3000);
    }).catch(err => {
      console.error(`Failed to copy text:`, err);
      setCopyStatus({ [type]: 'Failed' });
       setTimeout(() => setCopyStatus({}), 3000);
    });
  };

  const renderAsset = (
    label: string, 
    description: string, 
    value: string, 
    copyKey: string
  ) => (
    <div>
      <label className="block text-sm font-bold text-slate-300">{label}</label>
      <p className="text-xs text-slate-400 mb-2">{description}</p>
      <div className="flex items-center space-x-2">
        <input 
          type="text" 
          value={value} 
          readOnly
          className="flex-grow w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-base text-slate-100" 
        />
        <button 
          onClick={() => handleCopyToClipboard(value, copyKey)} 
          className="px-4 py-2 text-sm font-semibold bg-slate-600 hover:bg-slate-500 rounded-md transition-colors w-28 text-center"
        >
          {copyStatus[copyKey] || 'Copy'}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
            <span>YouTube Growth Kit</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="p-6">
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <LoadingSpinner text="Building your Growth Kit..." />
                </div>
            ) : error ? (
                <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                    <p className="font-bold">An error occurred.</p>
                    <p>{error}</p>
                </div>
            ) : seoContent && (
                <div className="space-y-6 animate-fade-in">
                  {renderAsset(
                    'Shorts Title',
                    'For Shorts feed. Short, punchy, and under 40 characters.',
                    seoContent.shortsTitle,
                    'shorts'
                  )}
                  {renderAsset(
                    'Search-Optimized Question',
                    'For Search discovery. Use in description or as a long-form title.',
                    seoContent.searchQuestion,
                    'search'
                  )}
                  {renderAsset(
                    'Suggested Hashtags',
                    'For Browse & Categorization. Add these to your description.',
                    seoContent.suggestedHashtags.map(t => `#${t}`).join(' '),
                    'tags'
                  )}
                </div>
            )}
        </div>

        <footer className="p-4 bg-slate-900/50 rounded-b-xl flex justify-end items-center">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors">
                Done
            </button>
        </footer>
      </div>
    </div>
  );
};

export default SeoQuestionModal;
