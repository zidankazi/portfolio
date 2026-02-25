import { ChatBubble } from './ChatBubble';
import { SpotifyTrackCard } from './SpotifyTrackCard';

interface TrackData {
    isPlaying: boolean;
    title: string | null;
    artist?: string;
    albumArt?: string | null;
    url?: string;
}

async function getTrackData(): Promise<TrackData> {
    try {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) return { isPlaying: false, title: null };

        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization:
                    'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });
        const { access_token } = await tokenRes.json();
        if (!access_token) return { isPlaying: false, title: null };

        const headers = { Authorization: `Bearer ${access_token}` };

        // Currently playing
        const nowRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers,
            next: { revalidate: 30 },
        });

        if (nowRes.status === 200) {
            const nowData = await nowRes.json();
            if (nowData?.item) {
                const track = nowData.item;
                return {
                    isPlaying: nowData.is_playing,
                    title: track.name,
                    artist: track.artists.map((a: { name: string }) => a.name).join(', '),
                    albumArt: track.album.images[0]?.url ?? null,
                    url: track.external_urls.spotify,
                };
            }
        }

        // Recently played fallback
        const recentRes = await fetch(
            'https://api.spotify.com/v1/me/player/recently-played?limit=1',
            { headers, next: { revalidate: 30 } }
        );

        if (recentRes.status === 200) {
            const recentData = await recentRes.json();
            const track = recentData?.items?.[0]?.track;
            if (track) {
                return {
                    isPlaying: false,
                    title: track.name,
                    artist: track.artists.map((a: { name: string }) => a.name).join(', '),
                    albumArt: track.album.images[0]?.url ?? null,
                    url: track.external_urls.spotify,
                };
            }
        }

        return { isPlaying: false, title: null };
    } catch {
        return { isPlaying: false, title: null };
    }
}

export async function SpotifyCard() {
    const data = await getTrackData();

    if (!data.title) {
        return (
            <ChatBubble>
                <p>I listen to a lot of music.</p>
            </ChatBubble>
        );
    }

    return (
        <ChatBubble>
            <SpotifyTrackCard
                data={{
                    isPlaying: data.isPlaying,
                    title: data.title,
                    artist: data.artist,
                    albumArt: data.albumArt,
                    url: data.url,
                }}
            />
        </ChatBubble>
    );
}
