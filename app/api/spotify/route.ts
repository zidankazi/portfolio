import { NextResponse } from 'next/server';

const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/';
const USER = 'zidank6';

export async function GET() {
    try {
        const apiKey = process.env.LASTFM_API_KEY;
        if (!apiKey) return NextResponse.json({ isPlaying: false, title: null });

        const res = await fetch(
            `${LASTFM_API}?method=user.getrecenttracks&user=${USER}&api_key=${apiKey}&format=json&limit=1`,
            { next: { revalidate: 30 } }
        );

        const data = await res.json();
        const track = data.recenttracks?.track?.[0];
        if (!track) return NextResponse.json({ isPlaying: false, title: null });

        const isPlaying = track['@attr']?.nowplaying === 'true';
        const albumArt = track.image?.find((img: { size: string }) => img.size === 'large')?.['#text'] ?? null;

        return NextResponse.json({
            isPlaying,
            title: track.name,
            artist: track.artist['#text'],
            albumArt: albumArt || null,
            url: track.url,
        });
    } catch {
        return NextResponse.json({ isPlaying: false, title: null });
    }
}
