import { NextResponse } from 'next/server';
import { getTrack } from '@/lib/spotify.server';

export const revalidate = 0;

export async function GET() {
    return NextResponse.json(await getTrack());
}
