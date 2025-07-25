import { NextRequest, NextResponse } from 'next/server';
import { getMedicationsFromCache } from '@/lib/server-cache';

export async function GET(request: NextRequest) {
  try {
    const medications = await getMedicationsFromCache();
    return NextResponse.json(medications);
  } catch (error) {
    console.error('Error loading medications:', error);
    return NextResponse.json(
      { error: 'Failed to load medications' },
      { status: 500 }
    );
  }
}
