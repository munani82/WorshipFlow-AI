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
      // Call our dedicated server-side Scraper API
      const response = await fetch("/api/charts/weekly");
      if (!response.ok) throw new Error("서버로부터 데이터를 가져오지 못했습니다.");
      return await response.json();
    } catch (error: any) {
      console.error("Chart Fetch Error:", error);
      throw new Error("벅스 뮤직에서 실시간 순위를 가져오는 과정에 문제가 발생했습니다. (서버 연결 실패)");
    }
  },

  async getRecommendation(userTheme: string): Promise<Recommendation> {
    const key = getApiKey();
    if (!key) throw new Error("API 키가 설정되지 않았습니다.");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Recommend a professional 5-song worship setlist for theme: "${userTheme}".
        
        CRITICAL ACCURACY REQUIREMENT:
        - You MUST search Tunebat.com (https://tunebat.com) for EVERY recommended song.
        - You MUST extract the EXACT Key and BPM from Tunebat. do NOT use your own memory or guess.
        - The Key must be in standard notation (e.g., G, E, Ab, Bm).
        
        SONG SELECTION:
        - Major Korean teams (Markers, Anointing, Welove, J-US, etc.).
        - Seamless transitions: Fast songs in same key, Build-up in same key.`,
        config: {
          tools: [{ googleSearch: {} }],
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

      return JSON.parse(response.text);
    } catch (error: any) {
      console.error("Recommendation Error:", error);
      throw new Error("셋리스트 추천 생성에 실패했습니다. (Tunebat 데이터 확인 중 오류)");
    }
  },
};
