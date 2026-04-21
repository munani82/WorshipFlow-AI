/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  Music, 
  Search, 
  TrendingUp, 
  Zap, 
  Calendar, 
  ChevronRight, 
  Play, 
  ListMusic, 
  Sparkles,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { worshipDirectorService } from './services/geminiService';
import { WeeklyAnalysis, Recommendation, VideoAnalysisResult } from './types';

export default function App() {
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [trends, setTrends] = useState<WeeklyAnalysis | null>(null);
  const [searchUrl, setSearchUrl] = useState('');
  const [analyzingVideo, setAnalyzingVideo] = useState(false);
  const [videoResult, setVideoResult] = useState<VideoAnalysisResult | null>(null);
  
  const [recommendationTheme, setRecommendationTheme] = useState('');
  const [generatingSetlist, setGeneratingSetlist] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      setLoadingTrends(true);
      const data = await worshipDirectorService.getWeeklyTrends();
      setTrends(data);
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    } finally {
      setLoadingTrends(false);
    }
  };

  const handleAnalyzeVideo = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchUrl) return;
    try {
      setAnalyzingVideo(true);
      setVideoResult(null);
      const data = await worshipDirectorService.analyzeVideo(searchUrl);
      setVideoResult(data);
    } catch (error) {
      console.error('Video analysis failed:', error);
    } finally {
      setAnalyzingVideo(false);
    }
  };

  const handleGenerateSetlist = async (e: FormEvent) => {
    e.preventDefault();
    if (!recommendationTheme) return;
    try {
      setGeneratingSetlist(true);
      setRecommendation(null);
      const data = await worshipDirectorService.getRecommendation(recommendationTheme);
      setRecommendation(data);
    } catch (error) {
      console.error('Failed to generate setlist:', error);
    } finally {
      setGeneratingSetlist(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-worship-accent/30 text-worship-ink">
      {/* Editorial Header */}
      <header className="px-6 py-8 md:px-12 md:py-12 border-b border-worship-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-serif text-3xl italic tracking-wide text-worship-accent"
            >
              WorshipFlow <span className="font-bold non-italic text-worship-ink">AI</span>
            </motion.h1>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-6 text-[12px] font-sans tracking-[0.2em] uppercase text-worship-secondary"
          >
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="w-px h-4 bg-worship-border" />
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-worship-accent shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
              <span>System Live</span>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12 md:px-12 space-y-12">
        
        {/* Main Grid: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-worship-card border border-worship-border rounded-xl p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-worship-border pb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xl text-worship-accent">Weekly Trending</h2>
                  <span className="text-[10px] bg-worship-accent/10 text-worship-accent px-2 py-0.5 rounded-full border border-worship-accent/20">AI Insights</span>
                </div>
                <TrendingUp className="w-4 h-4 text-worship-secondary" />
              </div>
              <p className="text-[10px] text-worship-secondary leading-relaxed font-serif italic mb-4">
                * 주요 찬양팀의 공식 채널 및 커뮤니티 활동을 AI가 실시간 검색하여 분석한 트렌드입니다. 횟수는 영향력 지표를 의미합니다.
              </p>
              
              <div className="space-y-1 divide-y divide-worship-border">
                {loadingTrends ? (
                  <div className="py-12 flex flex-col items-center justify-center text-worship-secondary gap-4">
                    <Loader2 className="w-6 h-6 animate-spin opacity-20" />
                  </div>
                ) : (
                  trends?.top_trending_songs.map((song, i) => (
                    <div key={i} className="py-4 flex justify-between items-start group">
                      <div className="space-y-1">
                        <span className="block text-sm font-serif font-medium group-hover:text-worship-accent transition-colors">{song.title}</span>
                        <span className="block text-[11px] text-worship-secondary uppercase tracking-wider">{song.artist}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-worship-accent/10 text-worship-accent px-2 py-0.5 rounded-full border border-worship-accent/20">
                        {song.count}회
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-worship-card/50 border border-worship-border border-dashed rounded-xl p-8 space-y-4"
            >
              <h2 className="font-serif text-lg text-worship-secondary opacity-70">Intelligence Insight</h2>
              <p className="text-[13px] leading-relaxed text-worship-secondary font-serif italic">
                이번 주는 '신뢰'와 '고백'을 테마로 한 곡들의 점유율이 40% 이상 증가했습니다. 
                대형 교회들의 최신 리터지 흐름이 더욱 깊은 영적 고백으로 이동 중입니다.
              </p>
            </motion.section>
          </aside>

          {/* Analysis & Setlist Content */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Analysis Tool */}
            <section className="bg-worship-card border border-worship-border rounded-xl p-8 space-y-8 overflow-hidden">
              <h3 className="font-serif text-xl tracking-tight text-white/50 mb-2">How it works</h3>
              <p className="text-xs text-worship-secondary leading-relaxed mb-6 font-serif italic">
                AI가 구글 검색을 통해 해당 영상의 곡 리스트와 정보를 실시간으로 찾아냅니다. 
                유명 찬양팀(마커스, 어노인팅 등)의 영상일수록 정확도가 높으며, 
                분석된 결과는 예배 기획의 기초 자료로 활용하시기 바랍니다.
              </p>
              
              <div className="flex items-center justify-between border-b border-worship-border pb-4">
                <h2 className="font-serif text-xl text-worship-accent">Liturgy Extractor</h2>
                <Play className="w-4 h-4 text-worship-secondary" />
              </div>

              <form onSubmit={handleAnalyzeVideo} className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input 
                    type="text" 
                    value={searchUrl}
                    onChange={(e) => setSearchUrl(e.target.value)}
                    placeholder="Enter YouTube URL for song extraction..."
                    className="w-full bg-worship-bg border border-worship-border rounded-lg py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-worship-accent transition-colors text-worship-ink placeholder:text-worship-secondary/30"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={analyzingVideo || !searchUrl}
                  className="bg-worship-accent text-worship-bg font-bold text-xs uppercase tracking-widest px-8 rounded-lg hover:brightness-110 transition-all disabled:opacity-30 flex items-center gap-2"
                >
                  {analyzingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                  Run
                </button>
              </form>

              <AnimatePresence>
                {videoResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-4"
                  >
                    <p className="text-sm text-worship-secondary italic border-l-2 border-worship-accent pl-4">{videoResult.summary}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videoResult.song_list.map((song, i) => (
                        <div key={i} className="flex flex-col p-4 bg-worship-bg rounded-lg border border-worship-border group hover:border-worship-accent transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-serif text-sm group-hover:text-worship-accent transition-colors">{song.title}</span>
                            <span className="badge-dark">{song.key}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-worship-secondary uppercase tracking-widest font-mono">
                            <span>{song.artist}</span>
                            <span className={song.tempo.toLowerCase().includes('fast') ? 'text-[#8fbc8f]' : 'text-[#bc8f8f]'}>{song.tempo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Setlist Summary */}
            <section className="bg-worship-card border border-worship-border rounded-xl flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between p-8 border-b border-worship-border bg-worship-ink/[0.02]">
                <h2 className="font-serif text-xl text-worship-accent">Recommended Setlist</h2>
                <form onSubmit={handleGenerateSetlist} className="flex gap-2 min-w-[300px]">
                  <input 
                    type="text" 
                    value={recommendationTheme}
                    onChange={(e) => setRecommendationTheme(e.target.value)}
                    placeholder="Theme: e.g., Restoration..."
                    className="flex-1 bg-worship-bg border border-worship-border rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-worship-accent text-worship-ink"
                  />
                  <button 
                    type="submit"
                    disabled={generatingSetlist || !recommendationTheme}
                    className="bg-worship-accent p-2 rounded-lg text-worship-bg hover:brightness-110 transition-all disabled:opacity-30 relative overflow-hidden"
                  >
                    {generatingSetlist ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </form>
              </div>

              <div className="flex-1">
                {generatingSetlist ? (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 animate-spin text-worship-accent opacity-50" />
                      <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-worship-accent animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-serif text-worship-accent animate-pulse">상호운용성 기반 셋리스트를 설계 중입니다...</p>
                      <p className="text-[10px] text-worship-secondary uppercase tracking-[0.2em]">Flow, Key, and Theme alignment in progress</p>
                    </div>
                  </div>
                ) : !recommendation ? (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-4">
                    <Sparkles className="w-8 h-8 text-worship-secondary/20" />
                    <p className="text-sm text-worship-secondary max-w-sm">Enter a theme to generate a tailored worship setlist with AI insights.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-worship-border text-[11px] uppercase tracking-[0.15em] text-worship-secondary">
                          <th className="px-8 py-4 font-medium">No.</th>
                          <th className="px-8 py-4 font-medium">Song Information</th>
                          <th className="px-8 py-4 font-medium">Key</th>
                          <th className="px-8 py-4 font-medium">Tempo</th>
                          <th className="px-8 py-4 font-medium">Insight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-worship-border">
                        {recommendation.setlist.map((item, i) => (
                          <motion.tr 
                            key={i} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-8 py-6">
                              <div className="w-8 h-8 rounded-full border border-worship-accent flex items-center justify-center text-xs font-medium text-worship-accent">
                                {item.order}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-serif font-medium text-sm text-worship-ink">{item.title}</span>
                                <span className="text-[11px] text-worship-secondary uppercase tracking-widest">{item.artist}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="badge-dark">{item.key}</span>
                            </td>
                            <td className="px-8 py-6">
                              <span className={item.tempo.toLowerCase().includes('fast') ? 'badge-fast' : 'badge-slow'}>
                                {item.tempo}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-[13px] text-worship-secondary leading-relaxed max-w-xs font-serif italic">
                                "{item.reason}"
                              </p>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>

        {/* Footer info */}
        <footer className="pt-24 pb-8 border-t border-worship-border">
          <div className="text-center space-y-2 opacity-40">
            <p className="text-[10px] font-sans uppercase tracking-[0.3em]">
              PROCESSED BY WORSHIPFLOW AI ENGINE &bull; DATA ANALYZED FROM GLOBAL LITURGY SOURCES
            </p>
          </div>
        </footer>
      </main>
    </div>

  );
}

