import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Exact Scraper Logic (Server-side bypasses CORS & AI Inference)
  app.get("/api/charts/weekly", async (req, res) => {
    try {
      const targetUrl = "https://music.bugs.co.kr/genre/chart/etc/nccm/total/week";
      const { data: html } = await axios.get(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      const $ = cheerio.load(html);
      const songs: any[] = [];

      // Targetting exact table rows in Bugs CCM Chart
      $("table.list.trackList tbody tr").each((index, element) => {
        if (index >= 10) return false; // Top 10 only

        const title = $(element).find("p.title a").text().trim();
        const artist = $(element).find("p.artist a").first().text().trim();
        
        let delta: "up" | "down" | "stable" = "stable";
        const rankInfo = $(element).find(".ranking");
        if (rankInfo.find(".arrow.up").length > 0) delta = "up";
        else if (rankInfo.find(".arrow.down").length > 0) delta = "down";

        if (title && artist) {
          songs.push({ title, artist, count: index + 1, delta });
        }
      });

      res.json({
        date: new Date().toLocaleDateString('ko-KR'),
        top_trending_songs: songs
      });
    } catch (error) {
      console.error("Scraping Error:", error);
      res.status(500).json({ error: "Bugs 서버로부터 데이터를 가져오는 데 실패했습니다." });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
