import { ContributionCalendarData, ContributionDay, ContributionWeek } from './types';

interface CacheEntry {
  data: ContributionCalendarData;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export class UserNotFoundError extends Error {
  constructor(username: string) {
    super(`GitHub user "${username}" was not found.`);
    this.name = 'UserNotFoundError';
  }
}

/**
 * Calculates current streak, longest streak, and stats from ordered days.
 */
function calculateStreaks(days: ContributionDay[]) {
  if (!days.length) {
    return { current: 0, longest: 0, total: 0, dailyAverage: 0 };
  }

  let total = 0;
  let longest = 0;
  let tempStreak = 0;

  for (const day of days) {
    total += day.count;
    if (day.count > 0) {
      tempStreak += 1;
      if (tempStreak > longest) {
        longest = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current streak working backwards from the latest day
  let current = 0;
  const today = new Date().toISOString().split('T')[0];
  const lastDay = days[days.length - 1];

  let i = days.length - 1;
  // If the last day is today and has 0 contributions, check if streak from yesterday is active
  if (lastDay && lastDay.date === today && lastDay.count === 0) {
    i -= 1;
  }

  while (i >= 0 && days[i].count > 0) {
    current += 1;
    i -= 1;
  }

  const dailyAverage = Number((total / Math.max(days.length, 1)).toFixed(2));

  return { current, longest, total, dailyAverage };
}

/**
 * Fetches contributions via GitHub GraphQL API.
 */
async function fetchViaGraphQL(username: string, token: string): Promise<ContributionCalendarData> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
                weekday
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'readme-cards-app',
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    if (json.errors[0]?.type === 'NOT_FOUND') {
      throw new UserNotFoundError(username);
    }
    throw new Error(json.errors[0]?.message || 'GraphQL query error');
  }

  const userData = json.data?.user;
  if (!userData) {
    throw new UserNotFoundError(username);
  }

  const calendar = userData.contributionsCollection.contributionCalendar;
  const allDays: ContributionDay[] = [];

  const levelMap: Record<string, 0 | 1 | 2 | 3 | 4> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  };

  const weeks: ContributionWeek[] = calendar.weeks.map((week: { contributionDays: Array<{ date: string; contributionCount: number; contributionLevel: string; weekday: number }> }) => {
    const days: (ContributionDay | null)[] = [null, null, null, null, null, null, null];
    for (const d of week.contributionDays) {
      const dayObj: ContributionDay = {
        date: d.date,
        count: d.contributionCount,
        level: levelMap[d.contributionLevel] ?? 0,
        weekday: d.weekday,
      };
      days[d.weekday] = dayObj;
      allDays.push(dayObj);
    }
    return { days };
  });

  allDays.sort((a, b) => a.date.localeCompare(b.date));
  const streak = calculateStreaks(allDays);

  return {
    username,
    totalContributions: calendar.totalContributions || streak.total,
    weeks,
    streak,
  };
}

/**
 * Fetches contributions via GitHub's public contribution HTML endpoint.
 * Zero token requirement.
 */
async function fetchViaScraper(username: string): Promise<ContributionCalendarData> {
  const url = `https://github.com/users/${encodeURIComponent(username)}/contributions`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (res.status === 404) {
    throw new UserNotFoundError(username);
  }

  if (!res.ok) {
    throw new Error(`GitHub scraper error: HTTP ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  // Extract total contributions: "3,692\n      contributions\n        in the last year"
  let totalContributions = 0;
  const totalMatch = html.match(/([\d,]+)\s+contributions\s+in the last year/i);
  if (totalMatch) {
    totalContributions = parseInt(totalMatch[1].replace(/,/g, ''), 10);
  }

  // Pre-extract tooltips into a lookup map: id -> count
  const tooltipMap = new Map<string, number>();
  const tooltipRegex = /<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]+)<\/tool-tip>/gi;
  let ttMatch: RegExpExecArray | null;
  while ((ttMatch = tooltipRegex.exec(html)) !== null) {
    const forId = ttMatch[1];
    const text = ttMatch[2];
    const countMatch = text.match(/^(\d+)\s+contribution/i);
    if (countMatch) {
      tooltipMap.set(forId, parseInt(countMatch[1], 10));
    } else {
      tooltipMap.set(forId, 0); // "No contributions on..."
    }
  }

  // Parse all <td> cells
  // Pattern: <td ... data-date="YYYY-MM-DD" ... id="..." data-level="X" ...></td>
  const tdRegex = /<td\s+[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*>/gi;
  const allDaysMap = new Map<string, ContributionDay>();
  const dayColMap = new Map<string, number>(); // date -> col index

  let tdMatch: RegExpExecArray | null;
  while ((tdMatch = tdRegex.exec(html)) !== null) {
    const tag = tdMatch[0];
    const date = tdMatch[1];

    const levelMatch = tag.match(/data-level="([0-4])"/);
    const level = (levelMatch ? parseInt(levelMatch[1], 10) : 0) as 0 | 1 | 2 | 3 | 4;

    const idMatch = tag.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : '';

    const ixMatch = tag.match(/data-ix="(\d+)"/);
    const colIx = ixMatch ? parseInt(ixMatch[1], 10) : 0;

    let count = 0;
    if (id && tooltipMap.has(id)) {
      count = tooltipMap.get(id)!;
    } else if (level > 0) {
      count = level; // fallback estimate if tooltip missing
    }

    // Determine weekday: date is YYYY-MM-DD in UTC
    const dateObj = new Date(date + 'T00:00:00Z');
    const weekday = dateObj.getUTCDay();

    allDaysMap.set(date, { date, count, level, weekday });
    dayColMap.set(date, colIx);
  }

  if (allDaysMap.size === 0) {
    throw new Error(`Could not parse contribution data for user "${username}".`);
  }

  const sortedDays = Array.from(allDaysMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Determine number of weeks
  let maxCol = 0;
  for (const col of dayColMap.values()) {
    if (col > maxCol) maxCol = col;
  }
  const weekCount = Math.max(maxCol + 1, 53);

  const weeks: ContributionWeek[] = [];
  for (let c = 0; c < weekCount; c++) {
    weeks.push({ days: [null, null, null, null, null, null, null] });
  }

  for (const day of sortedDays) {
    const col = dayColMap.get(day.date) ?? 0;
    if (col < weeks.length) {
      weeks[col].days[day.weekday] = day;
    }
  }

  const streak = calculateStreaks(sortedDays);
  if (!totalContributions) {
    totalContributions = streak.total;
  }

  return {
    username,
    totalContributions,
    weeks,
    streak,
  };
}

/**
 * Main public entrypoint: fetches calendar with caching and automatic fallback.
 */
export async function getContributionData(username: string, forceRefresh = false): Promise<ContributionCalendarData> {
  const cleanUsername = username.trim().toLowerCase();
  const cached = cache.get(cleanUsername);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let data: ContributionCalendarData | null = null;
  const token = process.env.GITHUB_TOKEN;

  if (token) {
    try {
      data = await fetchViaGraphQL(username.trim(), token);
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        throw err;
      }
      console.warn('GraphQL API failed, falling back to public scraper:', err);
    }
  }

  if (!data) {
    data = await fetchViaScraper(username.trim());
  }

  cache.set(cleanUsername, { data, timestamp: Date.now() });
  return data;
}
