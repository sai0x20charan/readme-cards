'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { THEMES } from '@/lib/themes';
import { GraphType, TimeRange } from '@/lib/types';

/* ─── inline icons ─── */
const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.2M22 12.5a10 10 0 0 1-18.8 4.2" />
  </svg>
);
const IconExternal = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
  </svg>
);
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ─── visualization type mini-previews: each icon mirrors the real chart ─── */
const IconHeatmap = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    {[
      [1, 1, 0.25], [5.5, 1, 0.5], [10, 1, 0.9], [14, 1, 1],
      [1, 5.5, 0.5], [5.5, 5.5, 1], [10, 5.5, 0.35], [14, 5.5, 0.75],
      [1, 10, 0.9], [5.5, 10, 0.35], [10, 10, 1], [14, 10, 0.5],
      [1, 14, 0.15], [5.5, 14, 0.65], [10, 14, 0.5], [14, 14, 0.9],
    ].map(([x, y, o], i) => (
      <rect key={i} x={x} y={y} width="3.2" height="3.2" rx="0.8" fill="currentColor" opacity={o} />
    ))}
  </svg>
);
const IconWave = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M1 13.5 C3.5 13.5 4 8.5 6.5 8.5 C9 8.5 9.5 13 12 12 C13.8 11.2 15 6.5 17 5.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="6.5" cy="8.5" r="1.4" fill="currentColor" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    <circle cx="17" cy="5.5" r="1.4" fill="currentColor" />
  </svg>
);
const IconStreakCard = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="1.5" y="2.5" width="15" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
    <path
      d="M9 5.2c-1.5 1.5-2.6 2.7-2.6 4.3a2.6 2.6 0 0 0 5.2 0c0-.6-.2-1.1-.5-1.6-.4.3-.7.7-.9 1.1-.2-.8-.5-2.2-1.2-3.8Z"
      fill="currentColor"
    />
    <rect x="11.2" y="6.2" width="3.3" height="1.3" rx="0.65" fill="currentColor" opacity="0.45" />
    <rect x="11.2" y="8.4" width="2.3" height="1.3" rx="0.65" fill="currentColor" opacity="0.3" />
  </svg>
);
const IconBars = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="1.5" y="9" width="2.8" height="6" rx="0.8" fill="currentColor" opacity="0.35" />
    <rect x="5.6" y="6" width="2.8" height="9" rx="0.8" fill="currentColor" opacity="0.55" />
    <rect x="9.7" y="3" width="2.8" height="12" rx="0.8" fill="currentColor" opacity="0.85" />
    <rect x="13.8" y="7.5" width="2.8" height="7.5" rx="0.8" fill="currentColor" opacity="1" />
  </svg>
);
const IconWeekdays = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="1.5" y="2.5" width="2.4" height="2.4" rx="0.7" fill="currentColor" opacity="0.9" />
    <rect x="5.2" y="2.5" width="11.3" height="2.4" rx="1.2" fill="currentColor" opacity="0.85" />
    <rect x="1.5" y="6.6" width="2.4" height="2.4" rx="0.7" fill="currentColor" opacity="0.5" />
    <rect x="5.2" y="6.6" width="7.5" height="2.4" rx="1.2" fill="currentColor" opacity="0.55" />
    <rect x="1.5" y="10.7" width="2.4" height="2.4" rx="0.7" fill="currentColor" opacity="0.35" />
    <rect x="5.2" y="10.7" width="9.5" height="2.4" rx="1.2" fill="currentColor" opacity="0.7" />
    <rect x="1.5" y="14.2" width="1" height="1" rx="0.5" fill="currentColor" opacity="0.4" />
  </svg>
);

const USERNAME_STORAGE_KEY = 'readme-cards:username';
const DEFAULT_USERNAME = 'torvalds';

function getCachedUsername(): string {
  if (typeof window === 'undefined') return DEFAULT_USERNAME;
  try {
    const cached = window.localStorage.getItem(USERNAME_STORAGE_KEY);
    if (cached && cached.trim()) return cached.trim();
  } catch {
    /* localStorage unavailable — fall back to default */
  }
  return DEFAULT_USERNAME;
}

function parseHex(hex: string): [number, number, number] {
  let clean = hex.trim().replace('#', '');
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/* Builds a 5-step level ramp from one seed color, blended out of the
   card background so the palette stays harmonious with the theme. */
function generateRamp(seed: string, background: string): [string, string, string, string, string] {
  const normalized = toHex(...parseHex(seed));
  return [
    mixHex(background, normalized, 0.1),
    mixHex(background, normalized, 0.32),
    mixHex(background, normalized, 0.55),
    mixHex(background, normalized, 0.78),
    normalized,
  ];
}

export default function Home() {
  const [username, setUsername] = useState(getCachedUsername);
  const [inputVal, setInputVal] = useState(getCachedUsername);
  const [graphType, setGraphType] = useState<GraphType>('calendar');
  const [range, setRange] = useState<TimeRange>('1y');
  const [theme, setTheme] = useState('github-dark');
  const [radius, setRadius] = useState(2.5);
  const [hideTitle, setHideTitle] = useState(false);
  const [hideLegend, setHideLegend] = useState(false);
  const [hideTotal, setHideTotal] = useState(false);
  const [hideStreak, setHideStreak] = useState(false);
  const [showBorder, setShowBorder] = useState(true);
  const [areaFill, setAreaFill] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [customLevels, setCustomLevels] = useState<[string, string, string, string, string]>([
    ...THEMES['github-dark'].levels,
  ] as [string, string, string, string, string]);

  // The editors always reflect the selected palette; tweaking any swatch
  // automatically forks it into a customization (sent as custom_levels / colors).
  const presetLevels = THEMES[theme]?.levels ?? THEMES['github-dark'].levels;
  const presetBackground = THEMES[theme]?.background ?? THEMES['github-dark'].background;
  const presetBorder = THEMES[theme]?.cardBorder ?? THEMES['github-dark'].cardBorder;
  const presetGrid = THEMES[theme]?.grid ?? presetBorder;
  const [customBackground, setCustomBackground] = useState(presetBackground);
  const [customBorder, setCustomBorder] = useState(presetBorder);
  const [customGrid, setCustomGrid] = useState(presetGrid);
  const isCustomized =
    customLevels.some((c, i) => c.toLowerCase() !== presetLevels[i].toLowerCase()) ||
    customBackground.toLowerCase() !== presetBackground.toLowerCase() ||
    customBorder.toLowerCase() !== presetBorder.toLowerCase() ||
    customGrid.toLowerCase() !== presetGrid.toLowerCase();

  const handleSelectTheme = (id: string) => {
    setTheme(id);
    const t = THEMES[id];
    if (t) {
      setCustomLevels([...t.levels] as [string, string, string, string, string]);
      setCustomBackground(t.background);
      setCustomBorder(t.cardBorder);
      setCustomGrid(t.grid ?? t.cardBorder);
    }
  };

  const handleResetPalette = () => {
    const t = THEMES[theme];
    if (t) {
      setCustomLevels([...t.levels] as [string, string, string, string, string]);
      setCustomBackground(t.background);
      setCustomBorder(t.cardBorder);
      setCustomGrid(t.grid ?? t.cardBorder);
    }
  };

  const [seedColor, setSeedColor] = useState('#39d353');

  const handleGenerateFromSeed = () => {
    setCustomLevels(generateRamp(seedColor, customBackground));
  };

  const [activeTab, setActiveTab] = useState<'markdown' | 'html' | 'url' | 'json' | 'action'>('markdown');
  const [copied, setCopied] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(0);
  const [mountTime] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('username', username.trim());
    if (graphType !== 'calendar') params.set('type', graphType);
    if (range !== '1y' && graphType !== 'streak') params.set('range', range);
    if (theme !== 'github-dark') params.set('theme', theme);
    if (isCustomized) {
      params.set('custom_levels', customLevels.map(c => c.replace('#', '')).join(','));
      if (customBackground.toLowerCase() !== presetBackground.toLowerCase()) {
        params.set('bg_color', customBackground.replace('#', ''));
      }
      if (customBorder.toLowerCase() !== presetBorder.toLowerCase()) {
        params.set('border_color', customBorder.replace('#', ''));
      }
      if (customGrid.toLowerCase() !== presetGrid.toLowerCase()) {
        params.set('grid_color', customGrid.replace('#', ''));
      }
    }
    if (graphType === 'calendar' && radius !== 2.5) params.set('radius', radius.toString());
    if (graphType === 'graph') {
      if (!areaFill) params.set('area', 'false');
      if (!showPoints) params.set('points', 'false');
      if (!showGrid) params.set('grid', 'false');
    }
    if (hideTitle) params.set('hide_title', 'true');
    if (graphType === 'calendar' && hideLegend) params.set('hide_legend', 'true');
    if (hideTotal) params.set('hide_total', 'true');
    if (graphType === 'calendar' && hideStreak) params.set('hide_streak', 'true');
    if (!showBorder) params.set('border', 'false');
    if (customTitle.trim()) params.set('title', customTitle.trim());
    if (cacheBuster > 0) params.set('refresh', '1');
    return params.toString();
  }, [username, graphType, range, theme, customLevels, customBackground, customBorder, customGrid, presetBackground, presetBorder, presetGrid, isCustomized, radius, hideTitle, hideLegend, hideTotal, hideStreak, showBorder, areaFill, showPoints, showGrid, customTitle, cacheBuster]);

  const [origin] = useState(() =>
    typeof window !== 'undefined' ? window.location.origin : ''
  );

  const relativeUrl = `/api/graph?${queryString}`;
  const fullUrl = origin ? `${origin}${relativeUrl}` : relativeUrl;
  const previewImgSrc = `${relativeUrl}&_v=${cacheBuster > 0 ? cacheBuster : mountTime}`;

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
        await res.json();
      } catch (err: unknown) {
        if (!isCancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to fetch user data');
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
      const clean = inputVal.trim();
      setUsername(clean);
      try {
        window.localStorage.setItem(USERNAME_STORAGE_KEY, clean);
      } catch {
        /* localStorage unavailable — username just won't persist */
      }
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanFullUrl = fullUrl.replace('&refresh=1', '');
  const embedCodes = {
    markdown: `[![${username}'s Readme Cards](${cleanFullUrl})](https://github.com/${username})`,
    html: `<a href="https://github.com/${username}">\n  <img src="${cleanFullUrl}" alt="${username}'s Readme Cards" />\n</a>`,
    url: cleanFullUrl,
    json: `${origin || ''}/api/data?username=${encodeURIComponent(username)}`,
    action: `name: Update Readme Cards SVG\non:\n  schedule:\n    - cron: '0 0 * * *'\n  workflow_dispatch:\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Generate SVG\n        run: |\n          curl -s "${cleanFullUrl}" -o readme-cards.svg\n      - name: Commit and Push\n        run: |\n          git config --global user.name "github-actions[bot]"\n          git config --global user.email "github-actions[bot]@users.noreply.github.com"\n          git add readme-cards.svg\n          git commit -m "chore: update readme-cards" || exit 0\n          git push`,
  };

  const graphTypes: { id: GraphType; label: string; desc: string; Icon: () => React.JSX.Element }[] = [
    { id: 'calendar', label: 'Heatmap', desc: '52-week contribution grid', Icon: IconHeatmap },
    { id: 'graph', label: 'Activity Curve', desc: 'Daily values, no averaging', Icon: IconWave },
    { id: 'streak', label: 'Streak Card', desc: 'Current & best streaks', Icon: IconStreakCard },
    { id: 'bar', label: 'Monthly Bars', desc: 'Volume per month', Icon: IconBars },
    { id: 'weekday', label: 'Weekday Habits', desc: 'Mon–Sun pattern', Icon: IconWeekdays },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* ─── Header ─── */}
      <header className="border-b border-zinc-800/60 backdrop-blur-md bg-zinc-950/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-14 sm:h-15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold tracking-tight text-zinc-100">Readme Cards</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setCacheBuster((v) => v + 1)}
              title="Refresh preview"
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
            >
              <IconRefresh />
            </button>
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              title="Open SVG in new tab"
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
            >
              <IconExternal />
            </a>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)] gap-8 lg:gap-10 items-start">

          {/* ─── Sidebar Controls ─── */}
          <aside className="space-y-7 lg:sticky lg:top-20">

            {/* Username Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                GitHub Username
              </label>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Enter username..."
                  spellCheck={false}
                  className="flex-1 min-w-0 bg-zinc-900/70 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition placeholder:text-zinc-600"
                />
                <button
                  type="submit"
                  title="Load User"
                  className="px-3.5 py-2.5 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white transition-all font-semibold flex items-center justify-center shadow-sm active:scale-95"
                >
                  <IconArrow />
                </button>
              </form>
            </div>

            {/* Graph Type */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Visualization Type
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {graphTypes.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGraphType(g.id)}
                    title={`${g.label} — ${g.desc}`}
                    className={`text-[13px] px-3 py-2.5 rounded-lg text-left transition-all flex items-center justify-between gap-2 border ${
                      graphType === g.id
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 font-semibold shadow-sm'
                        : 'bg-zinc-900/40 border-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 w-9 h-9 rounded-md flex items-center justify-center border transition-colors ${
                        graphType === g.id
                          ? 'bg-zinc-950/70 border-zinc-700 text-emerald-300'
                          : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-400'
                      }`}>
                        <g.Icon />
                      </span>
                      <span className="flex flex-col leading-tight min-w-0">
                        <span className="truncate">{g.label}</span>
                        <span className={`text-[11px] font-normal truncate ${graphType === g.id ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {g.desc}
                        </span>
                      </span>
                    </span>
                    {graphType === g.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Time Range */}
              {graphType !== 'streak' && (
                <div className="pt-1">
                  <div className="flex gap-1 bg-zinc-900/60 border border-zinc-850 rounded-lg p-1">
                    {(['1y', '6m', '3m', '30d'] as TimeRange[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRange(r)}
                        className={`flex-1 text-xs font-mono font-medium py-1.5 rounded-md transition-all ${
                          range === r
                            ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Color Theme
                </label>
                <span className="text-[11px] font-medium text-zinc-500">
                  {THEMES[theme]?.name ?? theme}{isCustomized ? ' • customized' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    title={t.name}
                    aria-pressed={theme === t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`p-1 rounded-md transition-all ${
                      theme === t.id
                        ? 'ring-2 ring-zinc-300 ring-offset-2 ring-offset-zinc-950 scale-105'
                        : 'hover:ring-1 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span className="flex overflow-hidden rounded-[3px]">
                      {t.levels.map((lvl, i) => (
                        <span key={i} className="w-4 h-4" style={{ backgroundColor: lvl }} />
                      ))}
                    </span>
                  </button>
                ))}
              </div>

              {/* Per-palette customization — selecting any palette loads it here for tweaking */}
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Customize {THEMES[theme]?.name ?? 'palette'}
                  </span>
                  {isCustomized && (
                    <button
                      type="button"
                      onClick={handleResetPalette}
                      className="text-[11px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                  <label
                    title={`Seed color — ${seedColor}. Click to pick, then hit Generate.`}
                    className="group relative block cursor-pointer"
                  >
                    <span
                      className="block w-8 h-8 rounded-md border border-zinc-600/80 shadow-inner transition-transform group-hover:scale-[1.05]"
                      style={{ backgroundColor: seedColor }}
                    />
                    <input
                      type="color"
                      value={seedColor}
                      onChange={(e) => setSeedColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label="Pick seed color for palette generation"
                    />
                  </label>
                  <span className="flex-1 text-[11px] leading-tight text-zinc-400">
                    Build the five levels from one color
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateFromSeed}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md bg-zinc-100 text-zinc-900 hover:bg-white active:scale-95 transition"
                  >
                    Generate
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Background', value: customBackground, set: setCustomBackground, hint: 'Card background' },
                    { label: 'Border', value: customBorder, set: setCustomBorder, hint: 'Card border' },
                    { label: 'Grid', value: customGrid, set: setCustomGrid, hint: 'Grid lines' },
                  ].map(({ label, value, set, hint }) => (
                    <label
                      key={label}
                      title={`${hint} — ${value}. Click to pick a color.`}
                      className="group relative flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 cursor-pointer"
                    >
                      <span
                        className="w-8 h-8 rounded-md border border-zinc-600/80 shadow-inner shrink-0 transition-transform group-hover:scale-[1.05]"
                        style={{ backgroundColor: value }}
                      />
                      <span className="flex flex-col leading-tight min-w-0">
                        <span className="text-[10px] font-semibold text-zinc-300 truncate">{label}</span>
                        <span className="text-[9px] font-mono uppercase text-zinc-500 truncate">{value}</span>
                      </span>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        aria-label={`Pick ${hint.toLowerCase()} color`}
                      />
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {customLevels.map((lvl, idx) => (
                    <label
                      key={idx}
                      title={`Level ${idx} — ${lvl}. Click to pick a color.`}
                      className="group relative flex flex-col items-center gap-1 rounded-md cursor-pointer"
                    >
                      <span
                        className="w-full h-9 rounded-md border border-zinc-600/80 shadow-inner transition-transform group-hover:scale-[1.03] group-active:scale-95"
                        style={{ backgroundColor: lvl }}
                      />
                      <input
                        type="color"
                        value={lvl}
                        onChange={(e) => {
                          const u = [...customLevels] as [string, string, string, string, string];
                          u[idx] = e.target.value;
                          setCustomLevels(u);
                        }}
                        className="absolute inset-x-0 top-0 h-9 opacity-0 cursor-pointer"
                        aria-label={`Pick color for level ${idx}`}
                      />
                      <span className="text-[10px] font-semibold text-zinc-400">L{idx}</span>
                      <span className="text-[9px] font-mono uppercase text-zinc-500 -mt-1">{lvl}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Customization Options */}
            <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-3.5">
              <button
                type="button"
                onClick={() => setOptionsOpen(!optionsOpen)}
                className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition w-full"
              >
                <span className="flex items-center gap-2">
                  <IconChevron open={optionsOpen} />
                  <span>Custom Options</span>
                </span>
              </button>

              {optionsOpen && (
                <div className="pt-3.5 space-y-3.5 border-t border-zinc-800/60 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Custom Title Text</label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g. My Activity"
                      spellCheck={false}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600 transition"
                    />
                  </div>

                  {graphType === 'calendar' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Corner Radius</span>
                        <span className="font-mono text-zinc-300">{radius}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={radius}
                        onChange={(e) => setRadius(parseFloat(e.target.value))}
                        className="w-full h-1 accent-zinc-300 cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-1">
                    {[
                      ...(graphType === 'graph' ? [
                        ['Area Fill', areaFill, setAreaFill] as const,
                        ['Data Points', showPoints, setShowPoints] as const,
                        ['Grid Lines', showGrid, setShowGrid] as const,
                      ] : []),
                      ['Title Header', !hideTitle, (v: boolean) => setHideTitle(!v)] as const,
                      ...(graphType !== 'streak' ? [['Total Count', !hideTotal, (v: boolean) => setHideTotal(!v)] as const] : []),
                      ...(graphType === 'calendar' ? [['Streaks', !hideStreak, (v: boolean) => setHideStreak(!v)] as const, ['Legend', !hideLegend, (v: boolean) => setHideLegend(!v)] as const] : []),
                      ['Outer Border', showBorder, setShowBorder] as const,
                    ].map(([label, checked, set]) => (
                      <label key={label} className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none hover:text-zinc-200 transition">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => set(e.target.checked)}
                          className="w-3.5 h-3.5 accent-zinc-300 cursor-pointer rounded border-zinc-700 bg-zinc-900"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ─── Preview Pane ─── */}
          <section className="space-y-6 min-w-0">

            {/* Preview Card */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden shadow-sm">
              {/* Preview Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/50 bg-zinc-900/40">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <span className="text-zinc-100">{username}</span>
                  <span className="text-zinc-600 font-normal">/</span>
                  <span className="text-zinc-400 capitalize font-normal">{graphType}</span>
                  {loading && (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin ml-1.5" />
                  )}
                </div>
                <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-zinc-800/70 text-zinc-400 border border-zinc-700/40">
                  {range}
                </span>
              </div>

              {/* SVG Canvas Area */}
              <div className="p-6 sm:p-10 flex justify-center items-center min-h-[380px] bg-zinc-950/40 overflow-x-auto">
                {errorMsg ? (
                  <div className="text-center space-y-1.5 py-6">
                    <p className="text-sm text-red-400 font-medium">{errorMsg}</p>
                    <p className="text-xs text-zinc-500">Please check spelling or profile visibility</p>
                  </div>
                ) : (
                  <div className="w-full flex justify-center items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewImgSrc}
                      alt={`${username}'s Readme Cards`}
                      className="w-full max-w-[880px] h-auto object-contain transition-all drop-shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Embed Code Section */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/50 bg-zinc-900/40 flex-wrap gap-2">
                <div className="flex gap-1 overflow-x-auto">
                  {(['markdown', 'html', 'url', 'json', 'action'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        activeTab === tab
                          ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(embedCodes[activeTab])}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    copied
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60'
                  }`}
                >
                  {copied ? <IconCheck /> : <IconCopy />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 font-mono text-xs leading-relaxed text-zinc-400 whitespace-pre-wrap break-all max-h-64 overflow-auto bg-zinc-950/60 selection:bg-zinc-800">
                {embedCodes[activeTab]}
              </pre>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
