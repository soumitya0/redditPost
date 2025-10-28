import React, { useState, useEffect, useCallback } from 'react';
import { RedditPost } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import LoadingSpinner from './LoadingSpinner';

interface SeoQuestionModalProps {
  post: RedditPost;
  onClose: () => void;
}

interface SeoContent {
    seoQuestion: string;
}

const SeoQuestionModal: React.FC<SeoQuestionModalProps> = ({ post, onClose }) => {
  const [seoContent, setSeoContent] = useState<SeoContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState('');

  const generateSeoQuestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a YouTube SEO expert specializing in crafting search-optimized questions to drive traffic from the 'YouTube search' source. Your task is to generate a single, highly specific question based on a Reddit video post.

**CRITICAL CONSTRAINTS:**
1.  **EXACTLY 8 WORDS:** The question you generate MUST be exactly eight words long. No more, no less.
2.  **NICHE & SEARCHABLE:** The question should target a niche audience with an estimated search volume of 5-10 searches per week. It should be a question real people would type into the YouTube search bar.
3.  **RELEVANT:** The question must be directly related to the content suggested by the video's title and subreddit.

**Video Details:**
*   **Subreddit:** r/${post.subreddit}
*   **Title:** "${post.title}"

Generate the 8-word SEO question.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              seoQuestion: {
                type: Type.STRING,
                description: "The generated SEO-optimized question, which must be exactly 8 words long."
              }
            },
            required: ["seoQuestion"]
          }
        }
      });
      
      const jsonResponse = JSON.parse(response.text);
      setSeoContent(jsonResponse);

    } catch (err) {
      console.error("Gemini API call for SEO question failed:", err);
      setError("Failed to generate SEO question. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [post]);

  useEffect(() => {
    generateSeoQuestion();
  }, [generateSeoQuestion]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    }).catch(err => {
      console.error(`Failed to copy text:`, err);
      setCopyStatus('Failed');
       setTimeout(() => setCopyStatus(''), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>AI-Generated SEO Question</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="p-6">
            {isLoading ? (
                <div className="flex justify-center items-center h-24">
                    <LoadingSpinner text="Generating SEO Question..." />
                </div>
            ) : error ? (
                <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                    <p className="font-bold">An error occurred.</p>
                    <p>{error}</p>
                </div>
            ) : seoContent && (
                <div className="space-y-4 animate-fade-in">
                    <p className="text-slate-400 text-sm">
                        Use this 8-word question in your YouTube video title or description to help people discover it through search.
                    </p>
                    <div className="flex items-center space-x-2">
                        <input 
                            type="text" 
                            value={seoContent.seoQuestion} 
                            readOnly
                            className="flex-grow w-full bg-slate-700/50 border border-slate-600 rounded-md py-2.5 px-3 text-lg font-semibold text-slate-100" 
                        />
                         <button onClick={() => handleCopyToClipboard(seoContent.seoQuestion)} className="px-4 py-2.5 text-sm font-semibold bg-slate-600 hover:bg-slate-500 rounded-md transition-colors w-28 text-center">
                            {copyStatus || 'Copy'}
                        </button>
                    </div>
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