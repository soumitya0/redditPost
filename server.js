import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5175;

// CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Enhanced proxy endpoint with multiple fallback strategies
app.get("/api/fetch", async (req, res) => {
  const target = req.query.url;
  if (!target || typeof target !== "string") {
    return res.status(400).json({ error: "Missing url query param" });
  }

  // Extract subreddit and parameters from the URL for fallback
  const subredditMatch = target.match(/\/r\/([^\/]+)/);
  const subreddit = subredditMatch ? subredditMatch[1] : null;
  
  // Set common response headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  // Strategy 1: Try original JSON API with multiple User-Agent strings
  const userAgents = [
    "RedditPostViewer/1.0 (by /u/reddituser)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "curl/7.68.0",
    "PostmanRuntime/7.28.0"
  ];

  for (const userAgent of userAgents) {
    try {
      console.log(`Trying with User-Agent: ${userAgent}`);
      const response = await fetch(target, {
        headers: { 
          Accept: "application/json",
          "User-Agent": userAgent,
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "DNT": "1",
          "Connection": "keep-alive",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "cross-site"
        },
        timeout: 10000
      });

      if (response.ok) {
        const text = await response.text();
        res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
        return res.status(response.status).send(text);
      } else if (response.status !== 403) {
        // If it's not a 403, return the error
        const text = await response.text();
        return res.status(response.status).send(text);
      }
      // If 403, continue to next user agent
    } catch (e) {
      console.log(`Failed with ${userAgent}:`, e.message);
      // Continue to next user agent
    }
  }

  // Strategy 2: Try RSS feed as fallback if we have subreddit info
  if (subreddit) {
    try {
      console.log(`Trying RSS fallback for subreddit: ${subreddit}`);
      const rssUrl = `https://www.reddit.com/r/${subreddit}/new.rss?limit=50`;
      const response = await fetch(rssUrl, {
        headers: { 
          "User-Agent": "RedditPostViewer/1.0 RSS Reader",
          Accept: "application/rss+xml, application/xml, text/xml"
        },
        timeout: 10000
      });

      if (response.ok) {
        const xmlText = await response.text();
        
        // Convert RSS to a simplified JSON format
        const posts = parseRSSToJSON(xmlText);
        const jsonResponse = {
          data: {
            children: posts.map(post => ({ data: post }))
          }
        };
        
        res.setHeader("Content-Type", "application/json");
        return res.status(200).json(jsonResponse);
      }
    } catch (e) {
      console.log("RSS fallback failed:", e.message);
    }
  }

  // If all strategies fail, return error
  return res.status(503).json({ 
    error: "All Reddit access methods failed", 
    details: "Reddit API is currently blocking requests from this server. Please try again later.",
    suggestion: "This usually resolves itself after some time. You can also try refreshing the page."
  });
});

// Simple RSS to JSON parser
function parseRSSToJSON(xmlText) {
  const posts = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  
  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entry = match[1];
    
    // Extract basic information
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    const authorMatch = entry.match(/<name>\/u\/(.*?)<\/name>/);
    const linkMatch = entry.match(/<link href="(.*?)" \/>/);
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    const idMatch = entry.match(/<id>(.*?)<\/id>/);
    
    if (titleMatch && authorMatch && linkMatch) {
      const post = {
        title: titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        author: authorMatch[1],
        url: linkMatch[1],
        permalink: linkMatch[1],
        created_utc: publishedMatch ? new Date(publishedMatch[1]).getTime() / 1000 : Date.now() / 1000,
        id: idMatch ? idMatch[1].replace('t3_', '') : Math.random().toString(36).substr(2, 9),
        score: 1, // RSS doesn't provide score
        num_comments: 0, // RSS doesn't provide comment count
        subreddit: 'IndianCivicFails', // Default, could be extracted
        is_self: !linkMatch[1].includes('i.redd.it') && !linkMatch[1].includes('v.redd.it')
      };
      posts.push(post);
    }
  }
  
  return posts;
}

// Serve dist
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
