import { NextRequest, NextResponse } from 'next/server';
import { preloadCache } from '@/lib/server-cache';

export async function POST(request: NextRequest) {
  try {
    console.log('Cache preload requested via API');
    await preloadCache();
    return NextResponse.json({ 
      message: 'Cache preload completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error preloading cache:', error);
    return NextResponse.json(
      { error: 'Failed to preload cache' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Cache preload endpoint',
    usage: 'POST to this endpoint to preload the cache'
  });
} 