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

// Simple and reliable Reddit API proxy
app.get("/api/fetch", async (req, res) => {
  const target = req.query.url;
  if (!target || typeof target !== "string") {
    return res.status(400).json({ error: "Missing url query param" });
  }

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  try {
    console.log(`Fetching: ${target}`);
    const response = await fetch(target, {
      headers: { 
        "User-Agent": "reddit-fails-viewer/1.0 (by /u/reddituser)",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const text = await response.text();
    
    if (response.ok) {
      res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
      return res.status(response.status).send(text);
    } else {
      console.log(`Reddit API returned ${response.status}: ${text.slice(0, 200)}`);
      return res.status(response.status).json({
        error: `Reddit API error: ${response.status}`,
        details: response.status === 403 ? 
          "Reddit is blocking requests from this server. This is temporary and usually resolves itself." :
          `HTTP ${response.status}: ${response.statusText}`
      });
    }
  } catch (e) {
    console.error("Proxy fetch failed:", e);
    return res.status(500).json({ 
      error: "Proxy fetch failed", 
      details: String(e) 
    });
  }
});

// Alternative endpoint with cleaner URL structure (like your suggestion)
app.get("/api/reddit/:subreddit", async (req, res) => {
  const { subreddit } = req.params;
  const sort = req.query.sort || 'new';
  const limit = req.query.limit || '50';
  
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  try {
    const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`;
    console.log(`Fetching subreddit: ${url}`);
    
    const response = await fetch(url, {
      headers: { 
        "User-Agent": "reddit-fails-viewer/1.0 (by /u/reddituser)",
        "Accept": "application/json"
      }
    });

    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      console.log(`Reddit API returned ${response.status}: ${text.slice(0, 200)}`);
      return res.status(response.status).json({
        error: `Reddit API error: ${response.status}`,
        details: response.status === 403 ? 
          "Reddit is blocking requests from this server. This is temporary and usually resolves itself." :
          `HTTP ${response.status}: ${response.statusText}`
      });
    }
  } catch (e) {
    console.error("Reddit fetch failed:", e);
    return res.status(500).json({ 
      error: "Reddit fetch failed", 
      details: String(e) 
    });
  }
});

// Serve dist
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
