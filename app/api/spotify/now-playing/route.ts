import { NextResponse } from 'next/server';

export const revalidate = 0; // no caching

interface TrackResult {
    isPlaying: boolean;
    title: string | null;
    artist?: string;
    albumArt?: string | null;
    url?: string;
}

async function getAccessToken(): Promise<string | null> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) return null;

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    });

    const data = await res.json();
    return data.access_token ?? null;
}

export async function GET() {
    try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
            return NextResponse.json({ isPlaying: false, title: null });
        }

        const headers = { Authorization: `Bearer ${accessToken}` };

        // Currently playing
        const nowRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers,
            cache: 'no-store',
        });

        if (nowRes.status === 200) {
            const nowData = await nowRes.json();
            if (nowData?.item) {
                const track = nowData.item;
                const result: TrackResult = {
                    isPlaying: nowData.is_playing,
                    title: track.name,
                    artist: track.artists.map((a: { name: string }) => a.name).join(', '),
                    albumArt: track.album.images[0]?.url ?? null,
                    url: track.external_urls.spotify,
                };
                return NextResponse.json(result);
            }
        }

        // Recently played fallback
        const recentRes = await fetch(
            'https://api.spotify.com/v1/me/player/recently-played?limit=1',
            { headers, cache: 'no-store' }
        );

        if (recentRes.status === 200) {
            const recentData = await recentRes.json();
            const track = recentData?.items?.[0]?.track;
            if (track) {
                const result: TrackResult = {
                    isPlaying: false,
                    title: track.name,
                    artist: track.artists.map((a: { name: string }) => a.name).join(', '),
                    albumArt: track.album.images[0]?.url ?? null,
                    url: track.external_urls.spotify,
                };
                return NextResponse.json(result);
            }
        }

        return NextResponse.json({ isPlaying: false, title: null });
    } catch {
        return NextResponse.json({ isPlaying: false, title: null });
    }
}
