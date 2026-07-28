import { ChatBubble } from './ChatBubble';
import { SpotifyTrackCard } from './SpotifyTrackCard';
import { getTrack } from '@/lib/spotify';

export async function SpotifyCard() {
    const data = await getTrack();

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
                initialData={{
                    isPlaying: data.isPlaying,
                    title: data.title,
                    artist: data.artist,
                    albumArt: data.albumArt,
                    url: data.url,
                    progressMs: data.progressMs,
                    durationMs: data.durationMs,
                }}
            />
        </ChatBubble>
    );
}
