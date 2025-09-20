import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5175;

// Proxy endpoint
app.get("/api/fetch", async (req, res) => {
  const target = req.query.url;
  if (!target || typeof target !== "string") {
    return res.status(400).json({ error: "Missing url query param" });
  }
  try {
    const upstream = await fetch(target, {
      headers: { Accept: "application/json" },
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json"
    );
    res.setHeader("Cache-Control", "no-store");
    return res.send(text);
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Proxy fetch failed", details: String(e) });
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
