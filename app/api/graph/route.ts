import { NextRequest, NextResponse } from 'next/server';
import { getContributionData, UserNotFoundError } from '@/lib/fetcher';
import { renderContributionSvg, renderErrorSvg } from '@/lib/svg';
import { RenderOptions } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || searchParams.get('user');

  if (!username) {
    const errorSvg = renderErrorSvg('Missing "username" query parameter. Example: ?username=torvalds');
    return new NextResponse(errorSvg, {
      status: 400,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Parse rendering options
  const theme = searchParams.get('theme') || 'github-dark';
  const customLevelsParam = searchParams.get('custom_levels');
  const customLevels = customLevelsParam ? customLevelsParam.split(',').map((c) => (c.startsWith('#') ? c : `#${c}`)) : undefined;

  const hideTitle = searchParams.get('hide_title') === 'true' || searchParams.get('hide_title') === '1';
  const hideLegend = searchParams.get('hide_legend') === 'true' || searchParams.get('hide_legend') === '1';
  const hideTotal = searchParams.get('hide_total') === 'true' || searchParams.get('hide_total') === '1';
  const hideStreak = searchParams.get('hide_streak') === 'true' || searchParams.get('hide_streak') === '1';
  const showBorder = searchParams.get('border') !== 'false' && searchParams.get('border') !== '0';
  const title = searchParams.get('title') || undefined;

  const radiusParam = searchParams.get('radius');
  const radius = radiusParam !== null ? parseFloat(radiusParam) : 2.5;

  const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.get('refresh') === '1';

  const renderOptions: RenderOptions = {
    theme,
    customLevels,
    hideTitle,
    hideLegend,
    hideTotal,
    hideStreak,
    radius: isNaN(radius) ? 2.5 : radius,
    showBorder,
    title,
  };

  try {
    const data = await getContributionData(username, forceRefresh);
    const svg = renderContributionSvg(data, renderOptions);

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    const isNotFound = error instanceof UserNotFoundError;
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contribution graph';
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
