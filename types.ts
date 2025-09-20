
export interface RedditPost {
  id: string;
  title: string;
  author: string;
  score: number;
  num_comments: number;
  permalink: string;
  url: string;
  created_utc: number;
  // FIX: Add subreddit property to the interface to resolve a type error.
  // This property is available from the Reddit API and is used in YouTubeModal.tsx.
  subreddit: string;
  post_hint?: 'image' | 'hosted:video' | 'link' | 'self';
  preview?: {
    images: {
      source: {
        url: string;
        width: number;
        height: number;
      };
      resolutions: {
        url: string;
        width: number;
        height: number;
      }[];
    }[];
  };
  media?: {
    reddit_video?: {
      fallback_url: string;
      hls_url: string;
      dash_url: string;
      duration: number;
      height: number;
      width: number;
      is_gif: boolean;
    };
  };
  is_video: boolean;
  thumbnail: string;
}
