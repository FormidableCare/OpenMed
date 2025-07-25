import { NextRequest, NextResponse } from 'next/server';
import { clearServerCache, getCacheStatus, preloadCache } from '@/lib/server-cache';

export async function DELETE(request: NextRequest) {
  try {
    clearServerCache();
    return NextResponse.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = getCacheStatus();
    return NextResponse.json({ 
      message: 'Cache management endpoint',
      status,
      endpoints: {
        'GET /api/cache': 'Get cache status',
        'DELETE /api/cache': 'Clear server cache',
        'POST /api/cache/preload': 'Preload cache'
      }
    });
  } catch (error) {
    console.error('Error in cache endpoint:', error);
    return NextResponse.json(
      { error: 'Cache endpoint error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/preload')) {
      await preloadCache();
      return NextResponse.json({ message: 'Cache preload completed' });
    }
    
    return NextResponse.json({ message: 'POST endpoint - use /preload to preload cache' });
  } catch (error) {
    console.error('Error preloading cache:', error);
    return NextResponse.json(
      { error: 'Failed to preload cache' },
      { status: 500 }
    );
  }
} 