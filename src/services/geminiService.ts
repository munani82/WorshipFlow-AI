import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { WeeklyAnalysis, Recommendation, VideoAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Search for and analyze recent (this week) worship trends in South Korean churches. Focus on major teams like Markers Worship, Anointing, Welove, J-US. For trending songs, prioritize music databases like Chosic.com to verify Key and BPM. Return the top trending songs from their latest releases or most-watched videos this week.",
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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

    return JSON.parse(response.text);
  },

  async getRecommendation(userTheme: string): Promise<Recommendation> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Recommend a professional worship setlist based on the theme: "${userTheme}".
      Include 4-5 songs that are widely sung in major South Korean churches. 
      CRITICAL: Cross-reference Chosic.com for every recommended song to provide precise Key and BPM information.
      Ensure a flow from energetic (Fast) to intimate (Slow).
      Mention why each song is chosen for this theme.`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
  },
};
