// Plain JSON returned by the Gleam encoder and passed to the Spotify card.
export interface Track {
    isPlaying: boolean;
    title: string | null;
    artist?: string;
    albumArt?: string | null;
    url?: string;
    progressMs?: number | null;
    durationMs?: number | null;
}
