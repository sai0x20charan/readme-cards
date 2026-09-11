import { NextRequest, NextResponse } from 'next/server';
import { getContributionData, UserNotFoundError } from '@/lib/fetcher';
import { renderContributionSvg, renderErrorSvg } from '@/lib/svg';
import { GraphType, RenderOptions, TimeRange } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeHexParam(value?: string): string | undefined {
  if (!value) return undefined;
  const clean = value.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(clean) || /^[0-9a-fA-F]{3}$/.test(clean)) {
    return clean.length === 3
      ? `#${clean.split('').map((c) => c + c).join('')}`.toLowerCase()
      : `#${clean}`.toLowerCase();
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse parameters
  const username = searchParams.get('username') || searchParams.get('user');

  if (!username) {
    const errorSvg = renderErrorSvg('Missing required parameter: username');
    return new NextResponse(errorSvg, {
      status: 400,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  const type = (searchParams.get('type') as GraphType) || 'calendar';
  const range = (searchParams.get('range') as TimeRange) || '1y';
  const theme = searchParams.get('theme') || 'github-dark';
  const radiusParam = searchParams.get('radius');
  const radius = radiusParam !== null ? parseFloat(radiusParam) : undefined;
  const heightParam = searchParams.get('height');
  const height = heightParam !== null ? parseInt(heightParam, 10) : undefined;
  const hideTitle = searchParams.get('hide_title') === 'true';
  const hideLegend = searchParams.get('hide_legend') === 'true';
  const hideTotal = searchParams.get('hide_total') === 'true';
  const hideStreak = searchParams.get('hide_streak') === 'true';
  const showBorder = searchParams.get('border') !== 'false';
  const areaFill = searchParams.get('area') !== 'false';
  const showPoints = searchParams.get('points') !== 'false';
  const showGrid = searchParams.get('grid') !== 'false';
  const title = searchParams.get('title') || undefined;
  const lineColor = searchParams.get('line_color') || undefined;
  const customBackground = normalizeHexParam(
    searchParams.get('bg_color') ?? searchParams.get('background') ?? undefined
  );
  const customBorder = normalizeHexParam(searchParams.get('border_color') ?? undefined);

  const customLevelsParam = searchParams.get('custom_levels');
  let customLevels: [string, string, string, string, string] | undefined = undefined;

  if (customLevelsParam) {
    const colors = customLevelsParam.split(',').map((c) => {
      const clean = c.trim().replace('#', '');
      return `#${clean}`;
    });

    if (colors.length === 5) {
      customLevels = colors as [string, string, string, string, string];
    }
  }

  const renderOptions: RenderOptions = {
    type,
    range,
    theme,
    radius,
    height,
    hideTitle,
    hideLegend,
    hideTotal,
    hideStreak,
    showBorder,
    areaFill,
    points: showPoints,
    showGrid,
    title,
    lineColor,
    customLevels,
    customBackground,
    customBorder,
  };

  const forceRefresh = searchParams.get('refresh') === '1' || searchParams.get('refresh') === 'true';

  try {
    const data = await getContributionData(username, forceRefresh);
    const svg = renderContributionSvg(data, renderOptions);

    const isDev = process.env.NODE_ENV === 'development';
    const cacheHeader = isDev || forceRefresh
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400';

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': cacheHeader,
      },
    });
  } catch (error) {
    const isNotFound = error instanceof UserNotFoundError;
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch GitView';
    const status = isNotFound ? 404 : 500;
    const errorSvg = renderErrorSvg(errorMessage);

    return new NextResponse(errorSvg, {
      status,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
