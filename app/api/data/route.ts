import { NextRequest, NextResponse } from 'next/server';
import { getContributionData, UserNotFoundError } from '@/lib/fetcher';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || searchParams.get('user');

  if (!username) {
    return NextResponse.json(
      { error: 'Missing "username" query parameter. Example: ?username=torvalds' },
      { status: 400 }
    );
  }

  const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.get('refresh') === '1';

  try {
    const data = await getContributionData(username, forceRefresh);
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    const isNotFound = error instanceof UserNotFoundError;
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
