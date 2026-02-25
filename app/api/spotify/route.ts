import { NextResponse } from 'next/server';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

async function getAccessToken(): Promise<string> {
    const clientId = process.env.SPOTIFY_CLIENT_ID!;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN!;

    const res = await fetch(TOKEN_URL, {
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
    return data.access_token;
}

export async function GET() {
    try {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            return NextResponse.json({ isPlaying: false, title: null });
        }

        const accessToken = await getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };

        // Try currently playing first
        const nowRes = await fetch(NOW_PLAYING_URL, {
            headers,
            next: { revalidate: 30 },
        });

        if (nowRes.status === 200) {
            const nowData = await nowRes.json();
            if (nowData?.item) {
                const track = nowData.item;
                return NextResponse.json({
                    isPlaying: nowData.is_playing,
                    title: track.name,
                    artist: track.artists.map((a: { name: string }) => a.name).join(', '),
                    albumArt: track.album.images[0]?.url ?? null,
                    url: track.external_urls.spotify,
                });
            }
        }

        // Fall back to recently played
        const recentRes = await fetch(RECENTLY_PLAYED_URL, {
            headers,
            next: { revalidate: 30 },
        });

        if (recentRes.status === 200) {
            const recentData = await recentRes.json();
            const track = recentData?.items?.[0]?.track;
            if (track) {
                return NextResponse.json({
                    isPlaying: false,
                    title: track.name,
                    artist: track.artists.map((a: { name: string }) => a.name).join(', '),
                    albumArt: track.album.images[0]?.url ?? null,
                    url: track.external_urls.spotify,
                });
            }
        }

        return NextResponse.json({ isPlaying: false, title: null });
    } catch {
        return NextResponse.json({ isPlaying: false, title: null });
    }
}
