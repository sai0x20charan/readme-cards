import { ContributionCalendarData, ContributionDay, RenderOptions, TimeRange } from './types';
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

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Filters weeks and days according to requested range:
 * 1y = ~53 weeks, 6m = 26 weeks, 3m = 13 weeks, 30d = 5 weeks
 */
function filterDataByRange(data: ContributionCalendarData, range?: TimeRange) {
  let weeks = data.weeks;
  if (range === '6m') {
    weeks = weeks.slice(Math.max(0, weeks.length - 26));
  } else if (range === '3m') {
    weeks = weeks.slice(Math.max(0, weeks.length - 13));
  } else if (range === '30d') {
    weeks = weeks.slice(Math.max(0, weeks.length - 5));
  }

  let days: ContributionDay[] = [];
  for (const w of weeks) {
    for (const d of w.days) {
      if (d) days.push(d);
    }
  }
  if (range === '30d' && days.length > 30) {
    days = days.slice(days.length - 30);
  }

  return { weeks, days };
}

/**
 * 1. Calendar Heatmap SVG Renderer
 */
export function renderContributionCalendar(
  data: ContributionCalendarData,
  options: RenderOptions = {}
): string {
  const theme = getTheme(options.theme, options.customLevels, {
    background: options.customBackground,
    border: options.customBorder,
  });
  const hideTitle = options.hideTitle ?? false;
  const hideLegend = options.hideLegend ?? false;
  const hideTotal = options.hideTotal ?? false;
  const hideStreak = options.hideStreak ?? false;
  const showBorder = options.showBorder ?? true;
  const radius = typeof options.radius === 'number' ? Math.max(0, Math.min(options.radius, 5)) : 2.5;

  const { weeks, days } = filterDataByRange(data, options.range);

  const cellDim = 10;
  const cellGap = 3;
  const colStep = cellDim + cellGap;

  const leftMargin = 34;
  const rightMargin = 20;
  const topMargin = hideTitle ? 16 : 46;
  const monthLabelHeight = 16;
  const gridTop = topMargin + monthLabelHeight;
  const gridHeight = 7 * colStep - cellGap;

  const footerTop = gridTop + gridHeight + 16;
  const footerHeight = hideLegend && hideStreak ? 0 : 20;
  const bottomMargin = 16;

  const totalCols = weeks.length;
  const gridWidth = totalCols * colStep - cellGap;
  const totalWidth = leftMargin + gridWidth + rightMargin;
  const totalHeight = footerTop + footerHeight + bottomMargin;

  // Month labels
  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;

  for (let c = 0; c < weeks.length; c++) {
    const week = weeks[c];
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

  const filteredMonthLabels: { label: string; x: number }[] = [];
  for (let i = 0; i < monthLabels.length; i++) {
    if (i === 0 || monthLabels[i].x - filteredMonthLabels[filteredMonthLabels.length - 1].x >= 32) {
      filteredMonthLabels.push(monthLabels[i]);
    }
  }

  // Cells
  const cells: string[] = [];
  for (let col = 0; col < weeks.length; col++) {
    const week = weeks[col];
    const x = leftMargin + col * colStep;

    for (let row = 0; row < 7; row++) {
      const day = week.days[row];
      const y = gridTop + row * colStep;
      if (!day) continue;

      const color = theme.levels[day.level] || theme.levels[0];
      const title = `${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`;

      cells.push(
        `<rect class=\"day-cell\" x=\"${x}\" y=\"${y}\" width=\"${cellDim}\" height=\"${cellDim}\" rx=\"${radius}\" fill=\"${color}\" data-count=\"${day.count}\" data-date=\"${day.date}\"><title>${escapeXml(title)}</title></rect>`
      );
    }
  }

  // Header
  let headerSvg = '';
  if (!hideTitle) {
    const titleText = options.title ? options.title : `${data.username}'s GitView`;
    const periodContributions = days.reduce((sum, d) => sum + d.count, 0);
    const formattedTotal = periodContributions.toLocaleString();

    headerSvg = `
      <g class="header">
        <text x="${leftMargin}" y="28" font-size="14" font-weight="600" fill="${theme.textPrimary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
          ${escapeXml(titleText)}
        </text>
        ${!hideTotal ? `
          <text x="${totalWidth - rightMargin}" y="28" text-anchor="end" font-size="12" font-weight="500" fill="${theme.textSecondary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
            ${formattedTotal} contributions
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

  // Day labels
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

  // Footer: streaks & legend
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
  // Inset by half the stroke width so the 1px border isn't clipped at the SVG
  // viewport edge (which makes corners look uneven / cut off).
  const bgRect = showBorder
    ? `<rect x="0.5" y="0.5" width="${totalWidth - 1}" height="${totalHeight - 1}" rx="8" fill="${theme.background}" ${borderAttr} />`
    : `<rect width="${totalWidth}" height="${totalHeight}" rx="8" fill="${theme.background}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" role="img" aria-label="${escapeXml(data.username)}'s GitView">
  <defs>
    <style>
      .day-cell { transition: opacity 0.15s ease; }
      .day-cell:hover { opacity: 0.8; stroke: ${theme.textPrimary}; stroke-width: 0.75; }
    </style>
  </defs>
  ${bgRect}
  ${headerSvg}
  <g class="month-labels">${monthLabelsSvg}</g>
  <g class="day-labels">${dayLabelsSvg}</g>
  <g class="cells">${cells.join('')}</g>
  ${footerSvg}
</svg>`.trim();
}

/**
 * Generates smooth SVG cubic bezier path string from coordinates.
 * Uses Fritsch-Carlson Monotone Cubic Spline interpolation (matching Chartist monotoneCubic):
 * - Guarantees monotonicity: the curve never overshoots above peaks or dips below the baseline.
 * - Smooth C1 continuity everywhere (no kinks or abrupt corner angles).
 * - Passes through every single data point with 100% mathematical precision.
 */
function createSmoothBezierPath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (n === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const dxs: number[] = [];
  const dys: number[] = [];
  const ds: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    const dy = ys[i + 1] - ys[i];
    dxs.push(dx);
    dys.push(dy);
    ds.push(dx === 0 ? 0 : dy / dx);
  }

  const ms = new Array<number>(n);
  ms[0] = ds[0];
  ms[n - 1] = ds[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (ds[i] === 0 || ds[i - 1] === 0 || (ds[i - 1] > 0) !== (ds[i] > 0)) {
      ms[i] = 0;
    } else {
      ms[i] = (3 * (dxs[i - 1] + dxs[i])) / (
        (2 * dxs[i] + dxs[i - 1]) / ds[i - 1] +
        (dxs[i] + 2 * dxs[i - 1]) / ds[i]
      );
      if (!isFinite(ms[i])) {
        ms[i] = 0;
      }
    }
  }

  let d = `M ${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const cp1x = xs[i] + dxs[i] / 3;
    const cp1y = ys[i] + (ms[i] * dxs[i]) / 3;
    const cp2x = xs[i + 1] - dxs[i] / 3;
    const cp2y = ys[i + 1] - (ms[i + 1] * dxs[i]) / 3;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${xs[i + 1].toFixed(1)} ${ys[i + 1].toFixed(1)}`;
  }
  return d;
}

/**
 * Exact Chartist.js getBounds algorithm used by node-chartist in github-readme-activity-graph.
 * Dynamically scales the Y axis directly from the user's commit history.
 */
function calculateAxisBounds(
  axisLength: number,
  maxValue: number,
  scaleMinSpace = 20
): { min: number; max: number; step: number; values: number[] } {
  function orderOfMagnitude(value: number): number {
    return Math.floor(Math.log(Math.abs(value)) / Math.LN10);
  }

  function projectLength(axisLen: number, length: number, b: { range: number }): number {
    return (length / Math.max(b.range, 1)) * axisLen;
  }

  function roundWithPrecision(value: number, digits = 8): number {
    const p = Math.pow(10, digits);
    return Math.round(value * p) / p;
  }

  function rho(num: number): number {
    if (num <= 1) return 1;
    function gcd(p: number, q: number): number {
      return p % q === 0 ? q : gcd(q, p % q);
    }
    function f(x: number): number {
      return (x * x + 1) % num;
    }
    let x1 = 2;
    let x2 = 2;
    let divisor: number;
    if (num % 2 === 0) return 2;
    do {
      x1 = f(x1);
      x2 = f(f(x2));
      divisor = gcd(Math.abs(x1 - x2), num);
    } while (divisor === 1);
    return divisor;
  }

  const high = Math.max(maxValue, 1);
  const low = 0;
  const bounds = {
    high,
    low,
    valueRange: high - low,
    oom: 0,
    step: 0,
    min: 0,
    max: 0,
    range: 0,
    values: [] as number[],
  };

  bounds.oom = orderOfMagnitude(bounds.valueRange);
  bounds.step = Math.pow(10, bounds.oom);
  bounds.min = Math.floor(bounds.low / bounds.step) * bounds.step;
  bounds.max = Math.ceil(bounds.high / bounds.step) * bounds.step;
  bounds.range = bounds.max - bounds.min;

  const scaleUp = projectLength(axisLength, bounds.step, bounds) < scaleMinSpace;
  const smallestFactor = rho(bounds.range);

  if (projectLength(axisLength, 1, bounds) >= scaleMinSpace) {
    bounds.step = 1;
  } else if (smallestFactor < bounds.step && projectLength(axisLength, smallestFactor, bounds) >= scaleMinSpace) {
    bounds.step = smallestFactor;
  } else {
    let count = 0;
    while (count++ < 1000) {
      if (scaleUp && projectLength(axisLength, bounds.step, bounds) <= scaleMinSpace) {
        bounds.step *= 2;
      } else if (!scaleUp && projectLength(axisLength, bounds.step / 2, bounds) >= scaleMinSpace) {
        bounds.step /= 2;
        if (bounds.step % 1 !== 0) {
          bounds.step *= 2;
          break;
        }
      } else {
        break;
      }
    }
  }

  bounds.step = Math.max(1, Math.round(bounds.step));
  let newMin = bounds.min;
  let newMax = bounds.max;
  while (newMin + bounds.step <= bounds.low) newMin += bounds.step;
  while (newMax - bounds.step >= bounds.high) newMax -= bounds.step;
  bounds.min = newMin;
  bounds.max = newMax;
  bounds.range = bounds.max - bounds.min;

  const values: number[] = [];
  for (let i = bounds.min; i <= bounds.max; i += bounds.step) {
    values.push(roundWithPrecision(i));
  }
  bounds.values = values;
  return bounds;
}

/**
 * 2. Daily Activity Curve SVG Renderer — smooth curve through true per-day values (no averaging)
 */
export function renderActivityGraph(
  data: ContributionCalendarData,
  options: RenderOptions = {}
): string {
  const theme = getTheme(options.theme, options.customLevels, {
    background: options.customBackground,
    border: options.customBorder,
  });
  const hideTitle = options.hideTitle ?? false;
  const hideTotal = options.hideTotal ?? false;
  const showBorder = options.showBorder ?? true;
  const areaFill = options.areaFill ?? true;
  const showPoints = options.points ?? true;
  const showGrid = options.showGrid ?? true;
  const accentColor = options.lineColor || theme.accent || theme.levels[4];

  const { days } = filterDataByRange(data, options.range);

  const totalWidth = 740;
  const totalHeight = typeof options.height === 'number' && !isNaN(options.height)
    ? Math.min(Math.max(options.height, 220), 600)
    : 260;

  const paddingLeft = 52;
  const paddingRight = 28;
  const paddingTop = hideTitle ? 28 : 55;
  const paddingBottom = 38;

  const chartWidth = totalWidth - paddingLeft - paddingRight;
  const chartHeight = totalHeight - paddingTop - paddingBottom;
  const baselineY = paddingTop + chartHeight;

  // Adapt dynamically to the user's actual commit history — matching github-readme-activity-graph
  const maxDaily = Math.max(...days.map((d) => d.count), 0);
  // Ensure a reasonable minimum ceiling of 4 so a profile with only 1 commit doesn't stretch across the entire vertical height
  const bounds = calculateAxisBounds(chartHeight, Math.max(maxDaily, 4), 20);
  const yCeil = bounds.max;

  // Linear scaling: each commit corresponds to exact, uniform height across the chart
  const getY = (count: number): number => {
    if (count <= 0) return baselineY;
    return baselineY - (count / yCeil) * chartHeight;
  };

  // One point per day — no weekly averaging
  const points = days.map((day, index) => {
    const x = paddingLeft + (index / Math.max(days.length - 1, 1)) * chartWidth;
    const y = getY(day.count);
    return { x, y, count: day.count, date: day.date };
  });

  const linePath = createSmoothBezierPath(points);
  const firstX = points[0]?.x ?? paddingLeft;
  const lastX = points[points.length - 1]?.x ?? (paddingLeft + chartWidth);
  const areaPath = `${linePath} L ${lastX.toFixed(1)} ${baselineY.toFixed(1)} L ${firstX.toFixed(1)} ${baselineY.toFixed(1)} Z`;

  // Dot radius adapts to density so 1y (~365 points) stays readable
  const dotR = days.length > 250 ? 2 : days.length > 120 ? 2.5 : 3;

  // Grid lines and labels
  const gridLines: string[] = [];
  const xAxisLabels: string[] = [];
  const is30d = options.range === '30d' || days.length <= 40;

  // Month starts calculation for time ranges > 40 days
  const monthStarts: { index: number; x: number; label: string }[] = [];
  if (!is30d) {
    let lastMonth = -1;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (!p.date) continue;
      const d = new Date(p.date + 'T00:00:00Z');
      const m = d.getUTCMonth();
      if (m !== lastMonth) {
        monthStarts.push({
          index: i,
          x: p.x,
          label: MONTH_NAMES[m],
        });
        lastMonth = m;
      }
    }
  }

  // Filter month starts to prevent overlap if first month is near edge
  const filteredMonths: { x: number; label: string }[] = [];
  for (let i = 0; i < monthStarts.length; i++) {
    if (i === 0 && monthStarts.length > 1 && (monthStarts[1].x - monthStarts[0].x < 28)) {
      continue;
    }
    if (filteredMonths.length > 0 && monthStarts[i].x - filteredMonths[filteredMonths.length - 1].x < 24) {
      continue;
    }
    filteredMonths.push(monthStarts[i]);
  }

  if (showGrid) {
    // Horizontal grid lines across integer tick steps (matching .ct-grid stroke-opacity 0.3, stroke-dasharray 2px)
    for (const val of bounds.values) {
      const y = getY(val);
      gridLines.push(`
        <line x1="${paddingLeft}" y1="${y.toFixed(1)}" x2="${totalWidth - paddingRight}" y2="${y.toFixed(1)}" stroke="${theme.cardBorder}" stroke-opacity="0.3" stroke-dasharray="2" stroke-width="1" />
      `);
    }

    if (is30d) {
      // Vertical grid lines for each day in 30d range
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        gridLines.push(`
          <line x1="${p.x.toFixed(1)}" y1="${paddingTop}" x2="${p.x.toFixed(1)}" y2="${baselineY}" stroke="${theme.cardBorder}" stroke-opacity="0.2" stroke-dasharray="2" stroke-width="1" />
        `);
      }
    } else {
      // Vertical grid lines accurately aligned with calendar month boundaries
      for (const m of filteredMonths) {
        gridLines.push(`
          <line x1="${m.x.toFixed(1)}" y1="${paddingTop}" x2="${m.x.toFixed(1)}" y2="${baselineY}" stroke="${theme.cardBorder}" stroke-opacity="0.3" stroke-dasharray="2" stroke-width="1" />
        `);
      }
    }

    // Solid left and bottom coordinate axes
    gridLines.push(`
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${baselineY}" stroke="${theme.cardBorder}" stroke-width="1.2" stroke-opacity="0.8" />
      <line x1="${paddingLeft}" y1="${baselineY}" x2="${totalWidth - paddingRight}" y2="${baselineY}" stroke="${theme.cardBorder}" stroke-width="1.2" stroke-opacity="0.8" />
    `);
  } else {
    gridLines.push(`
      <line x1="${paddingLeft}" y1="${baselineY}" x2="${totalWidth - paddingRight}" y2="${baselineY}" stroke="${theme.cardBorder}" stroke-opacity="0.6" stroke-width="1" />
    `);
  }

  // Y-axis tick labels
  const yAxisLabels: string[] = [];
  for (const val of bounds.values) {
    const y = getY(val);
    yAxisLabels.push(`
      <text x="${paddingLeft - 8}" y="${(y + 3.5).toFixed(1)}" font-size="9" fill="${theme.textMuted}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${val}</text>
    `);
  }

  // X-axis labels
  if (is30d) {
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (!p.date) continue;
      const dayNum = parseInt(p.date.split('-')[2], 10);
      xAxisLabels.push(`
        <text x="${p.x.toFixed(1)}" y="${baselineY + 14}" font-size="8" fill="${theme.textMuted}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${dayNum}</text>
      `);
    }
  } else {
    for (const m of filteredMonths) {
      xAxisLabels.push(`
        <text x="${m.x.toFixed(1)}" y="${baselineY + 14}" font-size="10" fill="${theme.textMuted}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${m.label}</text>
      `);
    }
  }

  // Header
  const titleText = options.title ? options.title : `${data.username}'s Activity Curve`;
  const periodTotal = days.reduce((s, d) => s + d.count, 0);

  const borderAttr = showBorder ? `stroke="${theme.cardBorder}" stroke-width="1"` : '';
  // Inset by half the stroke width so the 1px border isn't clipped at the SVG
  // viewport edge (which makes corners look uneven / cut off).
  const bgRect = showBorder
    ? `<rect x="0.5" y="0.5" width="${totalWidth - 1}" height="${totalHeight - 1}" rx="8" fill="${theme.background}" ${borderAttr} />`
    : `<rect width="${totalWidth}" height="${totalHeight}" rx="8" fill="${theme.background}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" role="img" aria-label="${escapeXml(data.username)}'s daily activity curve">
  <defs>
    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.38" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.0" />
    </linearGradient>
    <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.8" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="1" />
    </linearGradient>
  </defs>
  ${bgRect}
  
  ${!hideTitle ? `
    <g class="header">
      <text x="${paddingLeft}" y="28" font-size="14" font-weight="600" fill="${theme.textPrimary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
        ${escapeXml(titleText)}
      </text>
      ${!hideTotal ? `
        <text x="${totalWidth - paddingRight}" y="28" text-anchor="end" font-size="12" font-weight="500" fill="${theme.textSecondary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
          ${periodTotal.toLocaleString()} contributions
        </text>
      ` : ''}
    </g>
  ` : ''}

  <!-- Axis Titles -->
  <g class="axis-titles">
    <text x="16" y="${(paddingTop + chartHeight / 2).toFixed(1)}" transform="rotate(-90 16 ${(paddingTop + chartHeight / 2).toFixed(1)})" font-size="9" font-weight="500" fill="${theme.textMuted}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">Contributions</text>
    <text x="${(paddingLeft + chartWidth / 2).toFixed(1)}" y="${baselineY + 27}" font-size="9" font-weight="500" fill="${theme.textMuted}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${is30d ? 'Days' : 'Timeline'}</text>
  </g>

  <!-- Grid lines -->
  <g class="grid">${gridLines.join('')}</g>

  <!-- Y-Axis Labels -->
  <g class="y-labels">${yAxisLabels.join('')}</g>

  <!-- Area Fill -->
  ${areaFill ? `<path d="${areaPath}" fill="url(#areaGradient)" />` : ''}

  <!-- Daily curve (true per-day values) -->
  <path d="${linePath}" fill="none" stroke="url(#lineGlow)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Daily points: one per day (including zero) — solid fill so the dot
       covers the line joint and stays visually centered on valleys/peaks.
       Hollow (background-filled) dots hide the vertex inside the circle,
       leaving two separated edge contacts that look off-center. -->
  ${showPoints ? points.map((p) => `
    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${dotR}" fill="${accentColor}" stroke="${theme.background}" stroke-width="1">
      <title>${p.count} contribution${p.count === 1 ? "" : "s"} on ${p.date}</title>
    </circle>
  `).join("") : ""}

  <!-- X-Axis Labels -->
  <g class="x-labels">${xAxisLabels.join('')}</g>
</svg>`.trim();
}

/**
 * 3. Dedicated Streak Stats Card SVG Renderer
 */
export function renderStreakCard(
  data: ContributionCalendarData,
  options: RenderOptions = {}
): string {
  const theme = getTheme(options.theme, options.customLevels, {
    background: options.customBackground,
    border: options.customBorder,
  });
  const showBorder = options.showBorder ?? true;
  const accentColor = options.lineColor || theme.accent || theme.levels[4];

  const width = 540;
  const height = 195;
  const borderAttr = showBorder ? `stroke="${theme.cardBorder}" stroke-width="1"` : '';
  // Inset by half the stroke width so the 1px border isn't clipped at the SVG
  // viewport edge (which makes corners look uneven / cut off).
  const bgRect = showBorder
    ? `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${theme.background}" ${borderAttr} />`
    : `<rect width="${width}" height="${height}" rx="10" fill="${theme.background}" />`;

  const streak = data.streak || { current: 0, longest: 0, total: 0, dailyAverage: 0 };
  const total = data.totalContributions || streak.total;

  const fontFamily = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
  // Lucide "flame" outline — renders as a clean flame silhouette when filled.
  const flamePath =
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';
  // Lucide "trophy" (stroke).
  const trophyPaths = `
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />`;
  // Mini contribution-grid glyph for the "total" column.
  const gridCells = [0.3, 0.65, 1, 0.55, 1, 0.45, 0.9, 0.4, 0.75]
    .map((opacity, i) => {
      const x = (i % 3) * 6.5;
      const y = Math.floor(i / 3) * 6.5;
      return `<rect x="${x}" y="${y}" width="5" height="5" rx="1.2" fill="${theme.textSecondary}" opacity="${opacity}" />`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(data.username)}'s contribution streaks">
  <defs>
    <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffb800" />
      <stop offset="55%" stop-color="#ff6b00" />
      <stop offset="100%" stop-color="#ff0055" />
    </linearGradient>
  </defs>

  ${bgRect}

  <!-- Card Header -->
  <g class="header">
    <rect x="22" y="18" width="28" height="28" rx="8" fill="url(#fireGrad)" />
    <g transform="translate(28, 24) scale(0.6667)">
      <path d="${flamePath}" fill="#ffffff" opacity="0.95" />
    </g>
    <text x="58" y="36" font-size="14" font-weight="700" fill="${theme.textPrimary}" font-family="${fontFamily}">
      ${escapeXml(options.title || `${data.username}'s Contribution Stats`)}
    </text>
  </g>

  <!-- 3 Stats Columns (shared geometry: badge cy=18, label y=46, value y=74, sub y=93) -->
  <!-- Column 1: Total Contributions -->
  <g transform="translate(20, 62)">
    <rect width="154" height="110" rx="8" fill="${theme.cardBorder}" opacity="0.25" />
    <circle cx="77" cy="18" r="12" fill="${theme.textSecondary}" opacity="0.15" />
    <g transform="translate(68, 9)">${gridCells}</g>
    <text x="77" y="46" text-anchor="middle" font-size="11" font-weight="600" letter-spacing="0.4" fill="${theme.textMuted}" font-family="${fontFamily}">TOTAL CONTRIBUTIONS</text>
    <text x="77" y="74" text-anchor="middle" font-size="24" font-weight="800" fill="${theme.textPrimary}" font-family="${fontFamily}">
      ${total.toLocaleString()}
    </text>
    <text x="77" y="93" text-anchor="middle" font-size="10" fill="${theme.textSecondary}" font-family="${fontFamily}">
      ${streak.dailyAverage} / day avg
    </text>
  </g>

  <!-- Column 2: Current Streak (Highlighted) -->
  <g transform="translate(193, 62)">
    <rect width="154" height="110" rx="8" fill="${theme.cardBorder}" opacity="0.45" stroke="${accentColor}" stroke-width="1.2" />
    <circle cx="77" cy="18" r="12" fill="#ff6b00" opacity="0.18" />
    <g transform="translate(67, 8) scale(0.8333)">
      <path d="${flamePath}" fill="url(#fireGrad)" />
    </g>
    <text x="77" y="46" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="0.4" fill="${accentColor}" font-family="${fontFamily}">CURRENT STREAK</text>
    <text x="77" y="74" text-anchor="middle" font-size="26" font-weight="800" fill="${accentColor}" font-family="${fontFamily}">
      ${streak.current} <tspan font-size="14" font-weight="600">days</tspan>
    </text>
    <text x="77" y="93" text-anchor="middle" font-size="10" fill="${theme.textSecondary}" font-family="${fontFamily}">
      ${streak.current > 0 ? 'Active now' : 'Streak resting'}
    </text>
  </g>

  <!-- Column 3: Longest Streak -->
  <g transform="translate(366, 62)">
    <rect width="154" height="110" rx="8" fill="${theme.cardBorder}" opacity="0.25" />
    <circle cx="77" cy="18" r="12" fill="#f59e0b" opacity="0.15" />
    <g transform="translate(68, 9) scale(0.75)" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${trophyPaths}
    </g>
    <text x="77" y="46" text-anchor="middle" font-size="11" font-weight="600" letter-spacing="0.4" fill="${theme.textMuted}" font-family="${fontFamily}">LONGEST STREAK</text>
    <text x="77" y="74" text-anchor="middle" font-size="24" font-weight="800" fill="${theme.textPrimary}" font-family="${fontFamily}">
      ${streak.longest} <tspan font-size="14" font-weight="600">days</tspan>
    </text>
    <text x="77" y="93" text-anchor="middle" font-size="10" fill="${theme.textSecondary}" font-family="${fontFamily}">
      Personal best
    </text>
  </g>
</svg>`.trim();
}

/**
 * 4. Monthly Contribution Bar Chart SVG Renderer
 */
export function renderBarChart(
  data: ContributionCalendarData,
  options: RenderOptions = {}
): string {
  const theme = getTheme(options.theme, options.customLevels, {
    background: options.customBackground,
    border: options.customBorder,
  });
  const hideTitle = options.hideTitle ?? false;
  const hideTotal = options.hideTotal ?? false;
  const showBorder = options.showBorder ?? true;
  const accentColor = options.lineColor || theme.accent || theme.levels[4];

  const { days } = filterDataByRange(data, options.range);

  // Group days by Month-Year
  const monthMap = new Map<string, { label: string; count: number }>();
  for (const d of days) {
    const key = d.date.substring(0, 7); // YYYY-MM
    const dateObj = new Date(d.date + 'T00:00:00Z');
    const monthLabel = MONTH_NAMES[dateObj.getUTCMonth()];
    const existing = monthMap.get(key) || { label: monthLabel, count: 0 };
    existing.count += d.count;
    monthMap.set(key, existing);
  }

  const months = Array.from(monthMap.values());
  const maxCount = Math.max(...months.map((m) => m.count), 20);

  const totalWidth = 660;
  const totalHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = hideTitle ? 25 : 55;
  const paddingBottom = 35;

  const chartWidth = totalWidth - paddingLeft - paddingRight;
  const chartHeight = totalHeight - paddingTop - paddingBottom;
  const barWidth = Math.min(32, Math.max(12, (chartWidth / Math.max(months.length, 1)) - 10));
  const step = chartWidth / Math.max(months.length, 1);

  const bars = months.map((m, i) => {
    const barHeight = (m.count / maxCount) * chartHeight;
    const x = paddingLeft + i * step + (step - barWidth) / 2;
    const y = paddingTop + chartHeight - barHeight;

    return `
      <g class="bar-group">
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="3" fill="${accentColor}" opacity="0.88">
          <title>${m.count} contributions in ${m.label}</title>
        </rect>
        <text x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" font-size="9" font-weight="600" fill="${theme.textSecondary}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
          ${m.count > 0 ? m.count : ''}
        </text>
        <text x="${(x + barWidth / 2).toFixed(1)}" y="${(paddingTop + chartHeight + 16).toFixed(1)}" font-size="10" fill="${theme.textMuted}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
          ${m.label}
        </text>
      </g>
    `;
  });

  const borderAttr = showBorder ? `stroke="${theme.cardBorder}" stroke-width="1"` : '';
  const titleText = options.title ? options.title : `${data.username}'s Monthly Breakdown`;
  const periodTotal = months.reduce((s, m) => s + m.count, 0);
  // Inset by half the stroke width so the 1px border isn't clipped at the SVG
  // viewport edge (which makes corners look uneven / cut off).
  const bgRect = showBorder
    ? `<rect x="0.5" y="0.5" width="${totalWidth - 1}" height="${totalHeight - 1}" rx="8" fill="${theme.background}" ${borderAttr} />`
    : `<rect width="${totalWidth}" height="${totalHeight}" rx="8" fill="${theme.background}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" role="img" aria-label="${escapeXml(data.username)}'s monthly contributions">
  ${bgRect}
  ${!hideTitle ? `
    <g class="header">
      <text x="${paddingLeft}" y="30" font-size="14" font-weight="600" fill="${theme.textPrimary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
        ${escapeXml(titleText)}
      </text>
      ${!hideTotal ? `
        <text x="${totalWidth - paddingRight}" y="30" text-anchor="end" font-size="12" font-weight="500" fill="${theme.textSecondary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
          ${periodTotal.toLocaleString()} contributions
        </text>
      ` : ''}
    </g>
  ` : ''}
  <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${totalWidth - paddingRight}" y2="${paddingTop + chartHeight}" stroke="${theme.cardBorder}" stroke-width="1" />
  <g class="bars">${bars.join('')}</g>
</svg>`.trim();
}

/**
 * 5. Weekday Productivity Chart SVG Renderer (Sun - Sat)
 */
export function renderWeekdayChart(
  data: ContributionCalendarData,
  options: RenderOptions = {}
): string {
  const theme = getTheme(options.theme, options.customLevels, {
    background: options.customBackground,
    border: options.customBorder,
  });
  const hideTitle = options.hideTitle ?? false;
  const hideTotal = options.hideTotal ?? false;
  const showBorder = options.showBorder ?? true;
  const accentColor = options.lineColor || theme.accent || theme.levels[4];

  const { days } = filterDataByRange(data, options.range);

  // Group by weekday 0 = Sun, 1 = Mon, ..., 6 = Sat
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of days) {
    counts[d.weekday] += d.count;
  }

  const maxCount = Math.max(...counts, 10);
  const totalWidth = 560;
  const totalHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = hideTitle ? 25 : 55;
  const paddingBottom = 35;

  const chartWidth = totalWidth - paddingLeft - paddingRight;
  const chartHeight = totalHeight - paddingTop - paddingBottom;
  const barWidth = 36;
  const step = chartWidth / 7;

  const bars = counts.map((count, i) => {
    const barHeight = (count / maxCount) * chartHeight;
    const x = paddingLeft + i * step + (step - barWidth) / 2;
    const y = paddingTop + chartHeight - barHeight;
    const isPeak = count === maxCount && count > 0;

    return `
      <g class="weekday-bar">
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth}" height="${barHeight.toFixed(1)}" rx="3" fill="${isPeak ? accentColor : theme.levels[2]}" opacity="${isPeak ? '1' : '0.85'}">
          <title>${count} contributions on ${WEEKDAY_NAMES[i]}days</title>
        </rect>
        <text x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" font-size="9" font-weight="600" fill="${theme.textSecondary}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
          ${count > 0 ? count : ''}
        </text>
        <text x="${(x + barWidth / 2).toFixed(1)}" y="${(paddingTop + chartHeight + 16).toFixed(1)}" font-size="10" font-weight="${isPeak ? '700' : '400'}" fill="${isPeak ? theme.textPrimary : theme.textMuted}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
          ${WEEKDAY_NAMES[i]}
        </text>
      </g>
    `;
  });

  const borderAttr = showBorder ? `stroke="${theme.cardBorder}" stroke-width="1"` : '';
  const titleText = options.title ? options.title : `${data.username}'s Day of Week Habit`;
  const periodTotal = counts.reduce((a, b) => a + b, 0);
  // Inset by half the stroke width so the 1px border isn't clipped at the SVG
  // viewport edge (which makes corners look uneven / cut off).
  const bgRect = showBorder
    ? `<rect x="0.5" y="0.5" width="${totalWidth - 1}" height="${totalHeight - 1}" rx="8" fill="${theme.background}" ${borderAttr} />`
    : `<rect width="${totalWidth}" height="${totalHeight}" rx="8" fill="${theme.background}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" role="img" aria-label="${escapeXml(data.username)}'s weekday habits">
  ${bgRect}
  ${!hideTitle ? `
    <g class="header">
      <text x="${paddingLeft}" y="30" font-size="14" font-weight="600" fill="${theme.textPrimary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
        ${escapeXml(titleText)}
      </text>
      ${!hideTotal ? `
        <text x="${totalWidth - paddingRight}" y="30" text-anchor="end" font-size="12" font-weight="500" fill="${theme.textSecondary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
          ${periodTotal.toLocaleString()} contributions
        </text>
      ` : ''}
    </g>
  ` : ''}
  <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${totalWidth - paddingRight}" y2="${paddingTop + chartHeight}" stroke="${theme.cardBorder}" stroke-width="1" />
  <g class="bars">${bars.join('')}</g>
</svg>`.trim();
}

/**
 * Universal dispatcher
 */
export function renderContributionSvg(
  data: ContributionCalendarData,
  options: RenderOptions = {}
): string {
  const type = options.type || 'calendar';

  switch (type) {
    case 'graph':
      return renderActivityGraph(data, options);
    case 'streak':
      return renderStreakCard(data, options);
    case 'bar':
      return renderBarChart(data, options);
    case 'weekday':
      return renderWeekdayChart(data, options);
    case 'calendar':
    default:
      return renderContributionCalendar(data, options);
  }
}

export function renderErrorSvg(message: string, width = 600, height = 120): string {
  // Inset by half the stroke width so the border isn't clipped at the edge.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="8" fill="#0d1117" stroke="#da3633" stroke-width="1" />
  <circle cx="42" cy="60" r="18" fill="#f85149" opacity="0.15" />
  <path d="M42 50v14M42 68v2" stroke="#f85149" stroke-width="2.5" stroke-linecap="round" />
  <text x="76" y="55" font-size="14" font-weight="600" fill="#f85149" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
    GitView Error
  </text>
  <text x="76" y="75" font-size="12" fill="#8b949e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
    ${escapeXml(message)}
  </text>
</svg>`.trim();
}
