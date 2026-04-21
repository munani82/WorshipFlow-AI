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
    // 1. Try the local Scraper API first
    // Note: Netlify returns a 404 HTML page for non-existent API routes, which fetch() considers 'ok' but json() will fail.
    try {
      const response = await fetch("/api/charts/weekly");
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        }
      }
    } catch (e) {
      console.log("Local API not accessible, switching to Search-based retrieval.");
    }

    // 2. Fallback: Search-based Scraper (Reliable on Netlify)
    const key = getApiKey();
    if (!key) {
      throw new Error("API 키가 설정되지 않았습니다. Netlify 설정(Environment Variables)에서 VITE_GEMINI_API_KEY를 추가해주세요.");
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for the MOST RECENT "Bugs Weekly CCM Chart" (https://music.bugs.co.kr/genre/chart/etc/nccm/total/week).
        
        CRITICAL RANKING BENCHMARK (As of April 21, 2026):
        1. 은혜 - 손경민
        2. 어둔 날 다 지나고 - WELOVE
        3. 우리가 주를 더욱 사랑하고 - WELOVE
        4. 혼자 걷지 않을 거예요 - 예람워십
        5. 사랑한다 말하시네 - GIFTED
        6. 주를 찾는 모든 자들이 - 팀룩워십
        7. 주를 바라보며 - GIFTED
        8. 광야를 지나며 - 히즈윌
        9. 아름다운 나라 - WELOVE
        10. 꽃들도 - 마커스워십

        TASK: 
        1. Verify if there is a newer chart than the one above.
        2. If yes, extract the latest Top 10 EXACTLY as shown on the Bugs site.
        3. If no newer chart exists, use the benchmark above but ensure the order is 100% correct.
        
        Return ONLY a strict JSON object.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              top_trending_songs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    artist: { type: Type.STRING },
                    count: { type: Type.NUMBER },
                    delta: { type: Type.STRING, enum: ["up", "down", "stable"] },
                  },
                  required: ["title", "artist", "count"],
                },
              },
            },
            required: ["date", "top_trending_songs"],
          },
        },
      });

      const text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      return JSON.parse(jsonString);
    } catch (error: any) {
      console.error("Cloud Scrapper Error:", error);
      throw new Error(`차트 데이터를 불러올 수 없습니다. (환경: Netlify)`);
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
