import { NextResponse } from 'next/server';
import { getTrack } from '@/lib/spotify';

export const revalidate = 0; // no caching

export async function GET() {
    return NextResponse.json(await getTrack());
}
