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
      FOR EACH SONG: You MUST search and verify the official Key and Tempo (BPM) from Chosic.com for accurate musical data.
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
      const response = await fetch("/api/charts/weekly");
      if (!response.ok) {
        throw new Error("서버에서 정보를 가져올 수 없습니다.");
      }
      return await response.json();
    } catch (error: any) {
      console.error("Bugs API Error:", error);
      throw new Error(`주간 차트 로딩 실패: ${error.message || '서버 연결을 확인해 주세요.'}`);
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
