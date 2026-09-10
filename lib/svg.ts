import { ContributionCalendarData, RenderOptions } from './types';
import { getTheme } from './themes';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function renderContributionSvg(
  data: ContributionCalendarData,
  options: RenderOptions = {}
): string {
  const theme = getTheme(options.theme, options.customLevels);
  const hideTitle = options.hideTitle ?? false;
  const hideLegend = options.hideLegend ?? false;
  const hideTotal = options.hideTotal ?? false;
  const hideStreak = options.hideStreak ?? false;
  const showBorder = options.showBorder ?? true;
  const radius = typeof options.radius === 'number' ? Math.max(0, Math.min(options.radius, 5)) : 2.5;

  const cellDim = 10;
  const cellGap = 3;
  const colStep = cellDim + cellGap; // 13px

  const leftMargin = 34; // space for day labels: "Mon", "Wed", "Fri"
  const rightMargin = 20;
  const topMargin = hideTitle ? 16 : 46;
  const monthLabelHeight = 16;
  const gridTop = topMargin + monthLabelHeight;
  const gridHeight = 7 * colStep - cellGap; // 88px

  const footerTop = gridTop + gridHeight + 16;
  const footerHeight = hideLegend && hideStreak ? 0 : 20;
  const bottomMargin = 16;

  const totalCols = Math.max(data.weeks.length, 53);
  const gridWidth = totalCols * colStep - cellGap;
  const totalWidth = leftMargin + gridWidth + rightMargin;
  const totalHeight = footerTop + footerHeight + bottomMargin;

  // Compute month label positions
  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;

  for (let c = 0; c < data.weeks.length; c++) {
    const week = data.weeks[c];
    // Find first valid day in week
    const firstDay = week.days.find((d) => d !== null);
    if (firstDay) {
      const d = new Date(firstDay.date + 'T00:00:00Z');
      const month = d.getUTCMonth();
      if (month !== lastMonth) {
        monthLabels.push({
          label: MONTH_NAMES[month],
          x: leftMargin + c * colStep,
        });
        lastMonth = month;
      }
    }
  }

  // Filter out overlapping month labels if they are closer than 32px
  const filteredMonthLabels: { label: string; x: number }[] = [];
  for (let i = 0; i < monthLabels.length; i++) {
    if (i === 0 || monthLabels[i].x - filteredMonthLabels[filteredMonthLabels.length - 1].x >= 32) {
      filteredMonthLabels.push(monthLabels[i]);
    }
  }

  // Build grid cells
  const cells: string[] = [];
  for (let col = 0; col < data.weeks.length; col++) {
    const week = data.weeks[col];
    const x = leftMargin + col * colStep;

    for (let row = 0; row < 7; row++) {
      const day = week.days[row];
      const y = gridTop + row * colStep;

      if (!day) {
        continue;
      }

      const color = theme.levels[day.level] || theme.levels[0];
      const title = `${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`;

      cells.push(
        `<rect class="day-cell" x="${x}" y="${y}" width="${cellDim}" height="${cellDim}" rx="${radius}" fill="${color}" data-count="${day.count}" data-date="${day.date}"><title>${escapeXml(title)}</title></rect>`
      );
    }
  }

  // Header content
  let headerSvg = '';
  if (!hideTitle) {
    const titleText = options.title ? options.title : `${data.username}'s GitHub Contributions`;
    const formattedTotal = data.totalContributions.toLocaleString();

    headerSvg = `
      <g class="header">
        <text x="${leftMargin}" y="28" font-size="14" font-weight="600" fill="${theme.textPrimary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
          ${escapeXml(titleText)}
        </text>
        ${!hideTotal ? `
          <text x="${totalWidth - rightMargin}" y="28" text-anchor="end" font-size="12" font-weight="500" fill="${theme.textSecondary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
            ${formattedTotal} contributions in the last year
          </text>
        ` : ''}
      </g>
    `;
  }

  // Month labels SVG
  const monthLabelsSvg = filteredMonthLabels
    .map(
      (m) =>
        `<text x="${m.x}" y="${gridTop - 5}" font-size="10" fill="${theme.textMuted}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${m.label}</text>`
    )
    .join('');

  // Day labels SVG (Mon = row 1, Wed = row 3, Fri = row 5)
  const dayLabels = [
    { label: 'Mon', y: gridTop + 1 * colStep + 8 },
    { label: 'Wed', y: gridTop + 3 * colStep + 8 },
    { label: 'Fri', y: gridTop + 5 * colStep + 8 },
  ];
  const dayLabelsSvg = dayLabels
    .map(
      (d) =>
        `<text x="${leftMargin - 6}" y="${d.y}" text-anchor="end" font-size="9" fill="${theme.textMuted}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${d.label}</text>`
    )
    .join('');

  // Footer: streaks and legend
  let footerSvg = '';
  if (!hideLegend || !hideStreak) {
    let streakTextSvg = '';
    if (!hideStreak && data.streak) {
      const streakInfo = `Current streak: ${data.streak.current} ${data.streak.current === 1 ? 'day' : 'days'} • Longest: ${data.streak.longest} ${data.streak.longest === 1 ? 'day' : 'days'}`;
      streakTextSvg = `
        <text x="${leftMargin}" y="${footerTop + 10}" font-size="10" font-weight="500" fill="${theme.textSecondary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
          ${escapeXml(streakInfo)}
        </text>
      `;
    }

    let legendSvg = '';
    if (!hideLegend) {
      const legendX = totalWidth - rightMargin - 95;
      const legendY = footerTop;
      const legendSwatches = theme.levels
        .map((lvlColor, idx) => {
          const swatchX = legendX + 28 + idx * 12;
          return `<rect x="${swatchX}" y="${legendY + 1}" width="9" height="9" rx="1.5" fill="${lvlColor}" />`;
        })
        .join('');

      legendSvg = `
        <g class="legend">
          <text x="${legendX + 22}" y="${legendY + 9}" text-anchor="end" font-size="9" fill="${theme.textMuted}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">Less</text>
          ${legendSwatches}
          <text x="${legendX + 93}" y="${legendY + 9}" font-size="9" fill="${theme.textMuted}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">More</text>
        </g>
      `;
    }

    footerSvg = `<g class="footer">${streakTextSvg}${legendSvg}</g>`;
  }

  const borderAttr = showBorder ? `stroke="${theme.cardBorder}" stroke-width="1"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" role="img" aria-label="${escapeXml(data.username)}'s contribution graph">
  <defs>
    <style>
      .day-cell {
        transition: opacity 0.15s ease, transform 0.15s ease;
      }
      .day-cell:hover {
        opacity: 0.82;
        stroke: ${theme.textPrimary};
        stroke-width: 0.75;
      }
    </style>
  </defs>
  <rect width="100%" height="100%" rx="8" fill="${theme.background}" ${borderAttr} />
  ${headerSvg}
  <g class="month-labels">${monthLabelsSvg}</g>
  <g class="day-labels">${dayLabelsSvg}</g>
  <g class="cells">${cells.join('')}</g>
  ${footerSvg}
</svg>`.trim();
}

export function renderErrorSvg(message: string, width = 600, height = 120): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <rect width="100%" height="100%" rx="8" fill="#0d1117" stroke="#da3633" stroke-width="1" />
  <circle cx="42" cy="60" r="18" fill="#f85149" opacity="0.15" />
  <path d="M42 50v14M42 68v2" stroke="#f85149" stroke-width="2.5" stroke-linecap="round" />
  <text x="76" y="55" font-size="14" font-weight="600" fill="#f85149" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
    Contribution Graph Error
  </text>
  <text x="76" y="75" font-size="12" fill="#8b949e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
    ${escapeXml(message)}
  </text>
</svg>`.trim();
}
