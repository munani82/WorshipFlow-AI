export interface Song {
  title: string;
  artist: string;
  key: string;
  tempo: string;
  theme: string;
  reason?: string;
}

export interface WeeklyAnalysis {
  date: string;
  top_trending_songs: Array<{
    title: string;
    artist: string;
    count: number;
    delta?: 'up' | 'down' | 'stable';
  }>;
}

export interface Recommendation {
  theme: string;
  setlist: Array<{
    order: number;
    title: string;
    artist: string;
    key: string;
    tempo: string;
    reason: string;
  }>;
}

export interface VideoAnalysisResult {
  song_list: Song[];
  summary: string;
}
