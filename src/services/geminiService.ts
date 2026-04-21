/// <reference types="vite/client" />
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { WeeklyAnalysis, Recommendation, VideoAnalysisResult } from "../types";

// Improved API Key handling - Vite standard for client-side environment variables
const getApiKey = () => {
  // @ts-ignore
  const key = import.meta.env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
  if (!key) {
    console.warn("GEMINI_API_KEY is not defined. Please set VITE_GEMINI_API_KEY in your Netlify environment variables.");
  }
  return key as string;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const worshipDirectorService = {
  // previous methods... (analyzeVideo is unchanged)
  async analyzeVideo(youtubeUrl: string): Promise<VideoAnalysisResult> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for and analyze the worship songs from this YouTube video: ${youtubeUrl}.
      Focus on major Korean worship teams (Markers, Anointing, Welove, J-US, etc.). 
      FOR EACH SONG: You MUST search and verify the official Key and Tempo (BPM) from Tunebat.com for 100% molecular musical accuracy.
      Exclude global songs that are not translated or widely sung in South Korean churches.
      Extract the songs, their Keys, Tempos, and Themes.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            song_list: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  artist: { type: Type.STRING },
                  key: { type: Type.STRING },
                  tempo: { type: Type.STRING },
                  theme: { type: Type.STRING },
                },
                required: ["title", "artist", "key", "tempo", "theme"],
              },
            },
            summary: { type: Type.STRING },
          },
          required: ["song_list", "summary"],
        },
      },
    });

    return JSON.parse(response.text);
  },

  async getWeeklyTrends(): Promise<WeeklyAnalysis> {
    try {
      // 1. Fetch raw HTML from Bugs Music via a CORS proxy (to avoid browser security blocks)
      const targetUrl = encodeURIComponent("https://music.bugs.co.kr/genre/chart/etc/nccm/total/week");
      const proxyUrl = `https://api.allorigins.win/get?url=${targetUrl}`;
      
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("네트워크 상태가 불안정합니다.");
      
      const data = await res.json();
      const html = data.contents;
      
      // 2. Parse HTML using the browser's native DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      const songs: any[] = [];
      const rows = doc.querySelectorAll("table.list.trackList tbody tr");
      
      rows.forEach((row, index) => {
        if (index >= 10) return; // Top 10 only
        
        const titleElement = row.querySelector("p.title a");
        const artistElement = row.querySelector("p.artist a");
        
        if (titleElement && artistElement) {
          const title = titleElement.textContent?.trim() || "";
          const artist = artistElement.textContent?.trim() || "";
          
          let delta: "up" | "down" | "stable" = "stable";
          const arrow = row.querySelector(".ranking .arrow");
          if (arrow?.classList.contains("up")) delta = "up";
          else if (arrow?.classList.contains("down")) delta = "down";

          songs.push({
            title,
            artist,
            count: index + 1,
            delta
          });
        }
      });

      if (songs.length === 0) throw new Error("벅스 사이트 구조가 예상을 벗어났습니다.");

      return {
        date: new Date().toLocaleDateString('ko-KR'),
        top_trending_songs: songs
      };
    } catch (error: any) {
      console.error("Direct Scraping Error:", error);
      throw new Error("벅스 뮤직 웹사이트에서 직접 데이터를 가져오지 못했습니다. 사이트 접근을 확인해 주세요.");
    }
  },

  async getRecommendation(userTheme: string): Promise<Recommendation> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Recommend a professional worship setlist based on the theme: "${userTheme}".
        STRUCTURE:
        1. [Slow/Intimate] - 1 song
        2. [Fast] - 2 songs (MUST be in the SAME KEY as each other for seamless transition)
        3. [Build-up] - 2 songs (MUST be in the SAME KEY as each other for seamless transition)
        
        Total 5 songs. 
        Select popular songs from major Korean worship teams (Markers, Anointing, Welove, J-US, etc.).
        CRITICAL: For every song, you MUST search Tunebat.com to get the EXACT Key and BPM. do NOT guess.
        Mention why each song is chosen for this theme.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING },
              setlist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    order: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    artist: { type: Type.STRING },
                    key: { type: Type.STRING },
                    tempo: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ["order", "title", "artist", "key", "tempo", "reason"],
                },
              },
            },
            required: ["theme", "setlist"],
          },
        },
      });

      const text = response.text;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text;
        return JSON.parse(jsonString);
      } catch (e) {
        console.error("JSON Parse Error in getRecommendation. Raw response:", text);
        throw new Error("셋리스트 추천 데이터를 해석하는 중 오류가 발생했습니다.");
      }
    } catch (error: any) {
      console.error("Recommendation Error:", error);
      throw error;
    }
  },
};
