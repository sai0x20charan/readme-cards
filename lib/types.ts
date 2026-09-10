export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  weekday: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface ContributionWeek {
  days: (ContributionDay | null)[];
}

export interface ContributionStreak {
  current: number;
  longest: number;
  total: number;
  dailyAverage: number;
}

export interface ContributionCalendarData {
  username: string;
  totalContributions: number;
  weeks: ContributionWeek[];
  streak: ContributionStreak;
  year?: number | string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  background: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  levels: [string, string, string, string, string]; // [Level 0, Level 1, Level 2, Level 3, Level 4]
}

export interface RenderOptions {
  theme?: string;
  customLevels?: string[];
  hideTitle?: boolean;
  hideLegend?: boolean;
  hideTotal?: boolean;
  hideStreak?: boolean;
  radius?: number;
  showBorder?: boolean;
  title?: string;
}
