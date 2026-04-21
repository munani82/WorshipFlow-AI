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

  // JSON parsing middleware
  app.use(express.json());

  // AI-free Direct Scraping API for Bugs Music CCM Chart
  app.get("/api/charts/weekly", async (req, res) => {
    try {
      const url = "https://music.bugs.co.kr/genre/chart/etc/nccm/total/week";
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(html);
      
      const songs: any[] = [];
      const dateText = $(".chartDate").text()?.trim() || new Date().toISOString().split('T')[0];

      // Bugs chart structure: table.list.trackList tbody tr
      $("table.list.trackList tbody tr").each((index, element) => {
        if (index >= 10) return false; // Get Top 10

        const title = $(element).find("p.title a").text().trim();
        const artist = $(element).find("p.artist a").first().text().trim();
        const rank = index + 1;
        
        let delta = "stable";
        const rankIcon = $(element).find(".ranking .arrow");
        if (rankIcon.hasClass("up")) delta = "up";
        if (rankIcon.hasClass("down")) delta = "down";

        if (title && artist) {
          songs.push({
            title,
            artist,
            count: rank,
            delta
          });
        }
      });

      res.json({
        date: dateText,
        top_trending_songs: songs
      });
    } catch (error: any) {
      console.error("Scraping Error:", error.message);
      res.status(500).json({ error: "벅스 차트 데이터를 가져오지 못했습니다." });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
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
