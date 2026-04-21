import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { WeeklyAnalysis, Recommendation, VideoAnalysisResult } from "../types";

const apiKey = (process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY) as string;
const ai = new GoogleGenAI({ apiKey });

export const worshipDirectorService = {
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
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for the "Melon Weekly CCM Chart" for the most recent week in April 2026. 
        Focus on identifying the Top 10 songs. 
        The 'count' field MUST be the rank (1 for 1st place, up to 10). 
        Format your response as a strict JSON according to the schema.`,
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
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("JSON Parse Error in getWeeklyTrends. Raw response:", text);
        throw e;
      }
    } catch (error) {
      console.error("API Error in getWeeklyTrends:", error);
      throw error;
    }
  },

  async getRecommendation(userTheme: string): Promise<Recommendation> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Recommend a professional worship setlist based on the theme: "${userTheme}".
        STRUCTURE:
        - 1 Slow/Intimate song (잔잔한 곡)
        - 2 Fast songs (빠른 곡)
        - 1 or 2 Build-up songs (빌드업 곡)
        
        CRITICAL CONSTRAINT: All songs in the setlist MUST be in the SAME KEY (e.g., all G key, all A key, etc.) to allow for continuous flow.
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
        return JSON.parse(text);
      } catch (e) {
        console.error("JSON Parse Error in getRecommendation. Raw response:", text);
        throw e;
      }
    } catch (error) {
      console.error("API Error in getRecommendation:", error);
      throw error;
    }
  },
};
