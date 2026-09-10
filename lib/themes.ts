import { ThemeConfig } from './types';

export const THEMES: Record<string, ThemeConfig> = {
  'github-dark': {
    id: 'github-dark',
    name: 'GitHub Dark',
    background: '#0d1117',
    cardBorder: '#30363d',
    textPrimary: '#c9d1d9',
    textSecondary: '#8b949e',
    textMuted: '#6e7681',
    levels: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
    accent: '#39d353',
  },
  'github': {
    id: 'github',
    name: 'GitHub Light',
    background: '#ffffff',
    cardBorder: '#d0d7de',
    textPrimary: '#24292f',
    textSecondary: '#57606a',
    textMuted: '#8c959f',
    levels: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    accent: '#2da44e',
  },
  'dracula': {
    id: 'dracula',
    name: 'Dracula',
    background: '#282a36',
    cardBorder: '#44475a',
    textPrimary: '#f8f8f2',
    textSecondary: '#bd93f9',
    textMuted: '#6272a4',
    levels: ['#383a59', '#4d4f68', '#6272a4', '#bd93f9', '#ff79c6'],
    accent: '#ff79c6',
  },
  'ocean': {
    id: 'ocean',
    name: 'Ocean Cyan',
    background: '#0a192f',
    cardBorder: '#172a45',
    textPrimary: '#ccd6f6',
    textSecondary: '#64ffda',
    textMuted: '#8892b0',
    levels: ['#172a45', '#0d3b66', '#0077b6', '#00b4d8', '#64ffda'],
    accent: '#64ffda',
  },
  'fire': {
    id: 'fire',
    name: 'Flame Sunset',
    background: '#1a0b0b',
    cardBorder: '#3d1c1c',
    textPrimary: '#fbd38d',
    textSecondary: '#f6ad55',
    textMuted: '#9c4221',
    levels: ['#2d1515', '#6b1d1d', '#b83214', '#e06a14', '#fbbf24'],
    accent: '#fbbf24',
  },
  'cyberpunk': {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    background: '#0f051d',
    cardBorder: '#2d1447',
    textPrimary: '#fdfdfd',
    textSecondary: '#00f5ff',
    textMuted: '#8b5cf6',
    levels: ['#1e0c38', '#4c1d95', '#8b5cf6', '#d946ef', '#00f5ff'],
    accent: '#00f5ff',
  },
  'nord': {
    id: 'nord',
    name: 'Nord Frost',
    background: '#2e3440',
    cardBorder: '#3b4252',
    textPrimary: '#eceff4',
    textSecondary: '#88c0d0',
    textMuted: '#4c566a',
    levels: ['#3b4252', '#4c566a', '#5e81ac', '#81a1c1', '#88c0d0'],
    accent: '#88c0d0',
  },
  'monokai': {
    id: 'monokai',
    name: 'Monokai',
    background: '#272822',
    cardBorder: '#3e3d32',
    textPrimary: '#f8f8f2',
    textSecondary: '#a6e22e',
    textMuted: '#75715e',
    levels: ['#3e3d32', '#49483e', '#fd971f', '#f92672', '#a6e22e'],
    accent: '#a6e22e',
  },
  'halloween': {
    id: 'halloween',
    name: 'Halloween Spooky',
    background: '#151515',
    cardBorder: '#2e2e2e',
    textPrimary: '#f6ee54',
    textSecondary: '#fa8900',
    textMuted: '#888888',
    levels: ['#242424', '#631c03', '#bd561d', '#fa8900', '#f6ee54'],
    accent: '#fa8900',
  },
  'slate': {
    id: 'slate',
    name: 'Minimal Slate',
    background: '#090d16',
    cardBorder: '#1e293b',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#475569',
    levels: ['#1e293b', '#334155', '#64748b', '#94a3b8', '#e2e8f0'],
    accent: '#94a3b8',
  },
};

export const DEFAULT_THEME_ID = 'github-dark';

export function getTheme(themeId?: string, customLevels?: string[]): ThemeConfig {
  const base = (themeId && THEMES[themeId]) ? THEMES[themeId] : THEMES[DEFAULT_THEME_ID];
  
  if (customLevels && customLevels.length === 5) {
    return {
      ...base,
      id: 'custom',
      name: 'Custom',
      levels: customLevels as [string, string, string, string, string],
      accent: customLevels[4],
    };
  }
  
  return base;
}
