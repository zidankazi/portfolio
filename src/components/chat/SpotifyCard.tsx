import { ChatBubble } from './ChatBubble';
import { SpotifyTrackCard } from './SpotifyTrackCard';
import { getTrack } from '@/lib/spotify';

export async function SpotifyCard() {
    const data = await getTrack();

    return (
        <ChatBubble>
            <SpotifyTrackCard initialData={data} />
        </ChatBubble>
    );
}
