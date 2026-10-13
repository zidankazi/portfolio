export type Track = {
  title: string | null;
  artist?: string;
  url?: string;
  albumArt?: string | null;
  isPlaying: boolean;
  progressMs?: number | null;
  durationMs?: number | null;
};
type Credentials = {id: string; secret: string; refresh: string};
type ObjectValue = Record<string, unknown>;
const object = (value: unknown): ObjectValue => value !== null && typeof value === 'object' ? value as ObjectValue : {};
const milliseconds = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

export function decodeTrack(value: unknown): Track | null {
  const item = object(value);
  const url = object(item.external_urls).spotify;
  if (typeof item.name !== 'string' || typeof url !== 'string' || !url.startsWith('https://open.spotify.com/') || !Array.isArray(item.artists)) return null;
  const images = object(item.album).images;
  const image = Array.isArray(images) ? object(images[0]).url : null;
  return {
    title: item.name, artist: item.artists.map(artist => object(artist).name).filter(name => typeof name === 'string').join(', '),
    url, albumArt: typeof image === 'string' && image.startsWith('https://') ? image : null,
    isPlaying: false, progressMs: null, durationMs: milliseconds(item.duration_ms),
  };
}

export class SpotifyClient {
  private token = '';
  private expires = 0;
  private last: Track = {title: null, isPlaying: false};
  private recent: {track: Track; at: number} | null = null;
  private pending: Promise<Track> | null = null;
  private credentials: Credentials;
  private transport: typeof fetch;
  constructor(credentials: Credentials, transport: typeof fetch = fetch) {
    this.credentials=credentials; this.transport=transport;
  }

  private fallback(): Track {
    return {...this.last, isPlaying: false, progressMs: null};
  }
  private async request(url: string, options: RequestInit = {}): Promise<Response> {
    const result = await this.transport(url, {...options, signal: AbortSignal.timeout(10_000)});
    if (result.status === 401) this.token = '';
    if (!result.ok) throw new Error('Spotify request failed');
    return result;
  }
  private async accessToken(): Promise<string> {
    if (this.token && Date.now() < this.expires) return this.token;
    const {id, secret, refresh} = this.credentials;
    if (!id || !secret || !refresh) throw new Error('Spotify unavailable');
    const result = await this.request('https://accounts.spotify.com/api/token', {
      method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic '+Buffer.from(id+':'+secret).toString('base64')},
      body: new URLSearchParams({grant_type: 'refresh_token', refresh_token: refresh}),
    });
    const body = object(await result.json());
    if (typeof body.access_token !== 'string' || !body.access_token) throw new Error('Invalid Spotify token');
    const seconds = typeof body.expires_in === 'number' ? body.expires_in : 3600;
    this.token = body.access_token;
    this.expires = Date.now() + Math.max(0, seconds - 60) * 1000;
    return this.token;
  }
  private async load(): Promise<Track> {
    try {
      const token = await this.accessToken();
      const headers = {Authorization: 'Bearer '+token};
      const current = await this.request('https://api.spotify.com/v1/me/player/currently-playing', {headers});
      if (current.status !== 204) {
        const body = object(await current.json());
        const track = decodeTrack(body.item);
        if (track) {
          this.last = {...track, isPlaying: body.is_playing === true, progressMs: milliseconds(body.progress_ms)};
          return this.last;
        }
      }
      if (this.recent && Date.now() - this.recent.at < 60_000) return this.recent.track;
      const recent = await this.request('https://api.spotify.com/v1/me/player/recently-played?limit=1', {headers});
      const body = object(await recent.json());
      const track = decodeTrack(Array.isArray(body.items) ? object(body.items[0]).track : null);
      if (track) {
        this.last = track;
        this.recent = {track, at: Date.now()};
        return track;
      }
      return this.fallback();
    } catch {
      return this.fallback();
    }
  }
  getTrack(): Promise<Track> {
    if (!this.pending) this.pending = this.load().finally(() => {this.pending = null;});
    return this.pending;
  }
}
