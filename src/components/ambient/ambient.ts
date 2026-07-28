export type RGB = [number, number, number];
export type AmbientPalette = { primary: RGB; secondary: RGB };

/**
 * Tiny external store for the album-art palette. The Spotify card publishes
 * colors here after extraction; the page-level backdrop subscribes. Keeps
 * layout.tsx server-rendered — no context provider needed.
 */
let current: AmbientPalette | null = null;
const listeners = new Set<() => void>();

export function setAmbientPalette(palette: AmbientPalette) {
    current = palette;
    listeners.forEach((l) => l());
}

export function subscribeAmbient(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getAmbientPalette() {
    return current;
}

export function getAmbientServerSnapshot() {
    return null;
}
