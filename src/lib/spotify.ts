export interface Track {
    isPlaying: boolean;
    title: string | null;
    artist?: string;
    albumArt?: string | null;
    url?: string;
    progressMs?: number | null;
    durationMs?: number | null;
}

const EMPTY: Track = { isPlaying: false, title: null };

/**
 * Module-level caches — shared by the page's server render and the polling
 * route, and persist across warm invocations. They exist to keep us under
 * Spotify's rate limit (429s on recently-played take the whole card down):
 * the access token is reused until shortly before expiry, recently-played is
 * cached for a minute, and the last good track is served when Spotify errors.
 */
let tokenCache: { token: string; expiresAt: number } | null = null;
let recentCache: { track: Track; at: number } | null = null;
let lastGood: Track | null = null;

async function getAccessToken(): Promise<string | null> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) return null;

    if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

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
        cache: 'no-store',
    });
    const data = await res.json();
    if (!data.access_token) return null;

    // refresh a minute early
    const ttlMs = ((data.expires_in ?? 3600) - 60) * 1000;
    tokenCache = { token: data.access_token, expiresAt: Date.now() + ttlMs };
    return data.access_token;
}

interface SpotifyTrackItem {
    name: string;
    duration_ms?: number;
    artists: { name: string }[];
    album: { images: { url: string }[] };
    external_urls: { spotify: string };
}

function toTrack(item: SpotifyTrackItem, overrides: Partial<Track>): Track {
    return {
        isPlaying: false,
        title: item.name,
        artist: item.artists.map((a) => a.name).join(', '),
        albumArt: item.album.images[0]?.url ?? null,
        url: item.external_urls.spotify,
        progressMs: null,
        durationMs: item.duration_ms ?? null,
        ...overrides,
    };
}

export async function getTrack(): Promise<Track> {
    try {
        const accessToken = await getAccessToken();
        if (!accessToken) return lastGood ?? EMPTY;

        const headers = { Authorization: `Bearer ${accessToken}` };

        // Currently playing
        const nowRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers,
            cache: 'no-store',
        });

        if (nowRes.status === 200) {
            const nowData = await nowRes.json();
            if (nowData?.item) {
                const track = toTrack(nowData.item, {
                    isPlaying: nowData.is_playing,
                    progressMs: nowData.progress_ms ?? null,
                });
                lastGood = track;
                return track;
            }
        }

        // Recently played fallback — cached, it changes rarely and 429s easily
        if (recentCache && Date.now() - recentCache.at < 60_000) {
            return recentCache.track;
        }

        const recentRes = await fetch(
            'https://api.spotify.com/v1/me/player/recently-played?limit=1',
            { headers, cache: 'no-store' }
        );

        if (recentRes.status === 200) {
            const recentData = await recentRes.json();
            const item = recentData?.items?.[0]?.track;
            if (item) {
                const track = toTrack(item, {});
                recentCache = { track, at: Date.now() };
                lastGood = track;
                return track;
            }
        }

        // Spotify refused (rate limit, hiccup) — show the last track we knew
        return lastGood ? { ...lastGood, isPlaying: false, progressMs: null } : EMPTY;
    } catch {
        return lastGood ? { ...lastGood, isPlaying: false, progressMs: null } : EMPTY;
    }
}
