import 'server-only';
import { new_client, get_track_json } from '../../build/dev/javascript/portfolio/lib/spotify.mjs';
import type { Track } from '@/types/spotify';

// One client per server module instance, so Gleam can reuse its caches.
const client = new_client(
    process.env.SPOTIFY_CLIENT_ID ?? '',
    process.env.SPOTIFY_CLIENT_SECRET ?? '',
    process.env.SPOTIFY_REFRESH_TOKEN ?? '',
);

export async function getTrack(): Promise<Track> {
    // The Gleam encoder owns this wire format; no Gleam class instances reach React.
    return JSON.parse(await get_track_json(client)) as Track;
}
