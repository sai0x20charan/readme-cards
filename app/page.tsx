'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { THEMES } from '@/lib/themes';
import {
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Sliders,
  Palette,
  Code2,
  Sparkles,
  Flame,
  Calendar,
  Layers,
  Terminal,
  Download,
  AlertCircle
} from 'lucide-react';

export default function Home() {
  const [username, setUsername] = useState('torvalds');
  const [inputVal, setInputVal] = useState('torvalds');
  const [theme, setTheme] = useState('github-dark');
  const [radius, setRadius] = useState(2.5);
  const [hideTitle, setHideTitle] = useState(false);
  const [hideLegend, setHideLegend] = useState(false);
  const [hideTotal, setHideTotal] = useState(false);
  const [hideStreak, setHideStreak] = useState(false);
  const [showBorder, setShowBorder] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [customLevels, setCustomLevels] = useState<[string, string, string, string, string]>([
    '#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'
  ]);

  const [activeTab, setActiveTab] = useState<'markdown' | 'html' | 'url' | 'json' | 'action'>('markdown');
  const [copied, setCopied] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    totalContributions: number;
    currentStreak: number;
    longestStreak: number;
    dailyAverage: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick user presets
  const presets = ['torvalds', 'shadcn', 'antfu', 'yyx990803', 'sindresorhus'];

  // Construct query string
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('username', username.trim());
    if (theme !== 'github-dark') params.set('theme', theme);
    if (theme === 'custom') {
      params.set('custom_levels', customLevels.map(c => c.replace('#', '')).join(','));
    }
    if (radius !== 2.5) params.set('radius', radius.toString());
    if (hideTitle) params.set('hide_title', 'true');
    if (hideLegend) params.set('hide_legend', 'true');
    if (hideTotal) params.set('hide_total', 'true');
    if (hideStreak) params.set('hide_streak', 'true');
    if (!showBorder) params.set('border', 'false');
    if (customTitle.trim()) params.set('title', customTitle.trim());
    if (cacheBuster > 0) params.set('refresh', '1');
    return params.toString();
  }, [username, theme, customLevels, radius, hideTitle, hideLegend, hideTotal, hideStreak, showBorder, customTitle, cacheBuster]);

  // Construct endpoint URLs
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const relativeUrl = `/api/graph?${queryString}`;
  const fullUrl = origin ? `${origin}${relativeUrl}` : relativeUrl;

  // Fetch JSON stats whenever username changes
  useEffect(() => {
    let isCancelled = false;
    async function loadStats() {
      if (!username.trim()) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/data?username=${encodeURIComponent(username.trim())}${cacheBuster > 0 ? '&refresh=true' : ''}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'User not found' }));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!isCancelled) {
          setStats({
            totalContributions: data.totalContributions,
            currentStreak: data.streak?.current || 0,
            longestStreak: data.streak?.longest || 0,
            dailyAverage: data.streak?.dailyAverage || 0,
          });
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to fetch user data');
          setStats(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }
    loadStats();
    return () => { isCancelled = true; };
  }, [username, cacheBuster]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setUsername(inputVal.trim());
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Embed code snippets
  const cleanFullUrl = fullUrl.replace('&refresh=1', '');
  const embedCodes = {
    markdown: `[![${username}'s GitHub Contribution Graph](${cleanFullUrl})](https://github.com/${username})`,
    html: `<a href="https://github.com/${username}">\n  <img src="${cleanFullUrl}" alt="${username}'s GitHub Contribution Graph" />\n</a>`,
    url: cleanFullUrl,
    json: `${origin || ''}/api/data?username=${encodeURIComponent(username)}`,
    action: `name: Update Contribution Graph SVG
on:
  schedule:
    - cron: '0 0 * * *' # Every midnight
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate SVG
        run: |
          curl -s "${cleanFullUrl}" -o github-contribution-grid.svg
      - name: Commit and Push
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git add github-contribution-grid.svg
          git commit -m "chore: update contribution graph" || exit 0
          git push`,
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navigation header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-slate-100 text-base">GitHub Contribution Graph</h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Reliable
                </span>
              </div>
              <p className="text-xs text-slate-400">Fast SVG embed generator for profile READMEs</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5 py-1.5 px-3 rounded-md bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60"
            >
              <Terminal className="w-3.5 h-3.5" />
              API Docs
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Username Input Card */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-5 shadow-sm">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                GitHub Username
              </label>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="e.g. torvalds"
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-medium text-sm rounded-lg transition shadow-sm active:scale-95"
                >
                  Load
                </button>
              </form>

              {/* Presets */}
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500">Popular:</span>
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setInputVal(preset);
                      setUsername(preset);
                    }}
                    className={`text-xs px-2 py-0.5 rounded-md border transition ${
                      username === preset
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    @{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector Card */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-400" />
                  Color Theme
                </label>
                <span className="text-xs text-slate-500">{Object.keys(THEMES).length + 1} themes</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition ${
                      theme === t.id
                        ? 'bg-slate-800/80 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-xs font-medium text-slate-200 truncate">{t.name}</span>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      {t.levels.map((lvl, idx) => (
                        <div
                          key={idx}
                          className="w-2.5 h-2.5 rounded-xs"
                          style={{ backgroundColor: lvl }}
                        />
                      ))}
                    </div>
                  </button>
                ))}

                {/* Custom theme option */}
                <button
                  type="button"
                  onClick={() => setTheme('custom')}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition ${
                    theme === 'custom'
                      ? 'bg-slate-800/80 border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-xs font-medium text-slate-200">Custom Ramp</span>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    {customLevels.map((lvl, idx) => (
                      <div
                        key={idx}
                        className="w-2.5 h-2.5 rounded-xs"
                        style={{ backgroundColor: lvl }}
                      />
                    ))}
                  </div>
                </button>
              </div>

              {/* Custom Level Color Pickers */}
              {theme === 'custom' && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] text-slate-400 font-medium">Customize 5 intensity steps:</div>
                  <div className="grid grid-cols-5 gap-2">
                    {customLevels.map((lvl, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <input
                          type="color"
                          value={lvl}
                          onChange={(e) => {
                            const updated = [...customLevels] as [string, string, string, string, string];
                            updated[idx] = e.target.value;
                            setCustomLevels(updated);
                          }}
                          className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-slate-500">L{idx}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customization Options */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-5 shadow-sm space-y-4">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Layout & Sizing
              </label>

              {/* Custom Title */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Custom Title Text (optional)</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={`${username}'s GitHub Contributions`}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Corner Radius Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Square Corner Radius</span>
                  <span className="font-mono text-slate-300">{radius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={radius}
                  onChange={(e) => setRadius(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!hideTitle}
                    onChange={(e) => setHideTitle(!e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                  />
                  Show Title
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!hideTotal}
                    onChange={(e) => setHideTotal(!e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                  />
                  Show Total Count
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!hideStreak}
                    onChange={(e) => setHideStreak(!e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                  />
                  Show Streaks
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!hideLegend}
                    onChange={(e) => setHideLegend(!e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                  />
                  Show Legend
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBorder}
                    onChange={(e) => setShowBorder(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                  />
                  Card Border
                </label>
              </div>
            </div>

          </div>

          {/* Preview & Output column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Live SVG Preview Card */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-slate-200">Live Preview</h2>
                  {loading && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                      Updating...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCacheBuster((v) => v + 1)}
                    title="Force refresh data"
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open SVG in new tab"
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={fullUrl}
                    download={`${username}-contribution-graph.svg`}
                    title="Download SVG file"
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Rendered SVG Embed Container */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 overflow-x-auto flex justify-center min-h-[190px] items-center">
                {errorMsg ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-rose-400 gap-2">
                    <AlertCircle className="w-6 h-6 text-rose-400" />
                    <span className="text-sm font-medium">{errorMsg}</span>
                    <span className="text-xs text-slate-500">Check spelling or profile availability</span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={relativeUrl}
                    alt={`${username}'s GitHub contribution graph`}
                    className="max-w-full h-auto drop-shadow-md"
                  />
                )}
              </div>

              {/* Quick stats badges */}
              {stats && (
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-center">
                    <div className="text-[11px] text-slate-400">Total Year</div>
                    <div className="text-sm font-bold text-slate-100 font-mono">
                      {stats.totalContributions.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-center">
                    <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" /> Current
                    </div>
                    <div className="text-sm font-bold text-orange-400 font-mono">
                      {stats.currentStreak} d
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-center">
                    <div className="text-[11px] text-slate-400">Longest</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      {stats.longestStreak} d
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-center">
                    <div className="text-[11px] text-slate-400">Daily Avg</div>
                    <div className="text-sm font-bold text-cyan-400 font-mono">
                      {stats.dailyAverage}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Code Export Tabs */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-slate-200">Embed Snippets</span>
                </div>

                {/* Tab switchers */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('markdown')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      activeTab === 'markdown' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('html')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      activeTab === 'html' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      activeTab === 'url' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Raw URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('json')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      activeTab === 'json' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    JSON API
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('action')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      activeTab === 'action' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    GitHub Action
                  </button>
                </div>
              </div>

              {/* Code snippet block */}
              <div className="relative">
                <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                  {embedCodes[activeTab]}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopy(embedCodes[activeTab])}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400">
                {activeTab === 'markdown' && 'Paste this directly into your GitHub profile README.md.'}
                {activeTab === 'html' && 'Use this if you prefer HTML tags inside your markdown or website.'}
                {activeTab === 'url' && 'Direct SVG endpoint URL for custom image tags.'}
                {activeTab === 'json' && 'Returns raw JSON data with full day-by-day counts and streak calculations.'}
                {activeTab === 'action' && 'Runs on a GitHub cron schedule and saves the SVG directly into your repo.'}
              </p>
            </div>

          </div>

        </div>

        {/* Documentation / Query parameters section */}
        <div className="mt-12 bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-200">API Query Parameters Reference</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">Parameter</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Default</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">username</td>
                  <td className="py-2.5 px-3 text-slate-400">string</td>
                  <td className="py-2.5 px-3 text-slate-500">required</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">GitHub username to render (alias: user).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">theme</td>
                  <td className="py-2.5 px-3 text-slate-400">string</td>
                  <td className="py-2.5 px-3 text-slate-400">github-dark</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">github-dark, github, dracula, ocean, fire, cyberpunk, nord, monokai, halloween, slate, custom.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">custom_levels</td>
                  <td className="py-2.5 px-3 text-slate-400">csv string</td>
                  <td className="py-2.5 px-3 text-slate-500">none</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">5 comma-separated hex codes for levels 0 to 4 (e.g. 161b22,0e4429,006d32,26a641,39d353).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">radius</td>
                  <td className="py-2.5 px-3 text-slate-400">number</td>
                  <td className="py-2.5 px-3 text-slate-400">2.5</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Corner radius of day cells in pixels (0 to 5).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">hide_title</td>
                  <td className="py-2.5 px-3 text-slate-400">boolean</td>
                  <td className="py-2.5 px-3 text-slate-400">false</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Hides the title bar at the top of the card.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">hide_streak</td>
                  <td className="py-2.5 px-3 text-slate-400">boolean</td>
                  <td className="py-2.5 px-3 text-slate-400">false</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Hides the streak count in the footer.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">hide_legend</td>
                  <td className="py-2.5 px-3 text-slate-400">boolean</td>
                  <td className="py-2.5 px-3 text-slate-400">false</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Hides the Less/More legend swatches.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">border</td>
                  <td className="py-2.5 px-3 text-slate-400">boolean</td>
                  <td className="py-2.5 px-3 text-slate-400">true</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Controls outer border on the SVG card.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">refresh</td>
                  <td className="py-2.5 px-3 text-slate-400">boolean</td>
                  <td className="py-2.5 px-3 text-slate-400">false</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Bypasses server cache to fetch fresh contribution counts immediately.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        Dual engine: GitHub Public Scraper fallback + GraphQL API token support. Built with Next.js and SVG.
      </footer>
    </div>
  );
}
