export default async function handler(req, res) {
  const { subreddit } = req.query;
  const sort = req.query.sort || "hot";
  const limit = req.query.limit || 25;

  try {
    // Try different endpoints and approaches
    const endpoints = [
      `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`,
      `https://api.reddit.com/r/${subreddit}/${sort}?limit=${limit}`,
      `https://old.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`,
    ];

    let response;
    let lastError;

    for (const url of endpoints) {
      try {
        response = await fetch(url, {
          headers: {
            "User-Agent": "redditPostViewer/1.0 (by /u/anonymous)",
            Accept: "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (response.ok) {
          break;
        }
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    if (!response || !response.ok) {
      // Fallback: try without any special headers
      response = await fetch(
        `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`
      );
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Reddit API responded with status ${response.status}`,
      });
    }

    const data = await response.json();

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching from Reddit API:", error);
    res.status(500).json({ error: "Failed to fetch data from Reddit API" });
  }
}
