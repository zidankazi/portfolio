import Image from 'next/image';
import { ChatBubble } from './ChatBubble';

interface TrackData {
    isPlaying: boolean;
    title: string | null;
    artist?: string;
    albumArt?: string | null;
    url?: string;
}

async function getTrackData(): Promise<TrackData> {
    try {
        const apiKey = process.env.LASTFM_API_KEY;
        if (!apiKey) return { isPlaying: false, title: null };

        const res = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=zidank6&api_key=${apiKey}&format=json&limit=1`,
            { next: { revalidate: 30 } }
        );
        const data = await res.json();
        const track = data.recenttracks?.track?.[0];
        if (!track) return { isPlaying: false, title: null };

        const isPlaying = track['@attr']?.nowplaying === 'true';
        const albumArt = track.image?.find((img: { size: string }) => img.size === 'large')?.['#text'] ?? null;

        return {
            isPlaying,
            title: track.name,
            artist: track.artist['#text'],
            albumArt: albumArt || null,
            url: track.url,
        };
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
            <p className="mb-3">
                I listen to a lot of music, and <i className="font-heading">right now</i> I'm listening to this song:
            </p>
            <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 rounded-xl p-3 transition-colors group"
            >
                {data.albumArt ? (
                    <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden">
                        <Image
                            src={data.albumArt}
                            alt={`${data.title} album art`}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                        />
                    </div>
                ) : (
                    <div className="w-12 h-12 shrink-0 rounded-md bg-white/5 flex items-center justify-center">
                        <svg className="w-5 h-5 text-zinc-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-[14px] truncate group-hover:underline">
                        {data.title}
                    </p>
                    <p className="text-zinc-400 text-[13px] truncate">{data.artist}</p>
                </div>
                {/* Last.fm icon */}
                <svg
                    className="w-5 h-5 text-[#d51007] shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M10.584 17.21l-.88-2.392s-1.43 1.596-3.573 1.596c-1.897 0-3.244-1.65-3.244-4.296 0-3.38 1.704-4.596 3.38-4.596 2.42 0 3.19 1.57 3.85 3.572l.88 2.75c.88 2.67 2.53 4.815 7.302 4.815 3.42 0 5.73-1.045 5.73-3.797 0-2.227-1.265-3.38-3.63-3.93l-1.76-.385c-1.21-.275-1.566-.77-1.566-1.596 0-.935.742-1.485 1.952-1.485 1.32 0 2.035.494 2.145 1.65l2.75-.33C23.7 6.85 22.215 5.64 19.245 5.64c-3.05 0-4.816 1.43-4.816 3.795 0 1.815.88 2.97 3.08 3.52l1.87.44c1.375.33 1.98.88 1.98 1.87 0 1.1-.99 1.54-2.915 1.54-2.83 0-4.015-1.485-4.73-3.52l-.907-2.75C13.2 7.784 11.56 5.64 7.04 5.64 3.125 5.64.72 7.95.72 12.163c0 4.07 2.255 6.38 5.995 6.38 3.1 0 3.87-1.32 3.87-1.32z"/>
                </svg>
            </a>
        </ChatBubble>
    );
}
