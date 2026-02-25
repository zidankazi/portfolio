'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface TrackData {
    isPlaying: boolean;
    title: string;
    artist?: string;
    albumArt?: string | null;
    url?: string;
}

function SpotifyIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
    );
}

function Equalizer() {
    return (
        <div className="flex items-end gap-[2px] h-3">
            {[0, 0.15, 0.3, 0.1].map((delay, i) => (
                <span
                    key={i}
                    className="w-[2.5px] rounded-sm bg-white/20 animate-[equalizer_1.2s_ease-in-out_infinite]"
                    style={{
                        animationDelay: `${delay}s`,
                        height: '30%',
                    }}
                />
            ))}
        </div>
    );
}

/** Desaturate a color by mixing it toward gray */
function desaturate(r: number, g: number, b: number, amount = 0.5): [number, number, number] {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    return [
        Math.round(r + (gray - r) * amount),
        Math.round(g + (gray - g) * amount),
        Math.round(b + (gray - b) * amount),
    ];
}

export function SpotifyTrackCard({ data }: { data: TrackData }) {
    const [rgb, setRgb] = useState<[number, number, number] | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!data.albumArt) return;
        let cancelled = false;

        import('fast-average-color').then(({ FastAverageColor }) => {
            if (cancelled) return;
            const fac = new FastAverageColor();
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.src = data.albumArt!;
            img.onload = () => {
                if (cancelled) return;
                try {
                    const color = fac.getColor(img);
                    setRgb(desaturate(color.value[0], color.value[1], color.value[2], 0.25));
                } catch { /* card stays dark */ }
            };
            imgRef.current = img;
        });

        return () => { cancelled = true; };
    }, [data.albumArt]);

    return (
        <div>
            <p className="mb-3">
                I listen to a lot of music
                {data.isPlaying
                    ? <>, and <span className="text-white/60">right now</span> I&apos;m listening to:</>
                    : <>, and I last listened to:</>
                }
            </p>

            <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                className="group relative flex items-center gap-4 rounded-[14px] p-4 overflow-hidden"
                style={{
                    background: '#0c0c0c',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                {/* Color blobs — oversized, blurred, vivid */}
                {rgb && (
                    <div
                        className="pointer-events-none absolute -inset-[80%] z-0"
                        style={{
                            background: [
                                `radial-gradient(ellipse at 20% 20%, rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.6), transparent 50%)`,
                                `radial-gradient(ellipse at 80% 60%, rgba(${Math.min(rgb[0] + 50, 255)}, ${Math.max(rgb[1] - 30, 0)}, ${Math.min(rgb[2] + 60, 255)}, 0.45), transparent 45%)`,
                                `radial-gradient(ellipse at 50% 90%, rgba(${Math.max(rgb[0] - 30, 0)}, ${Math.min(rgb[1] + 40, 255)}, ${rgb[2]}, 0.3), transparent 50%)`,
                            ].join(', '),
                            filter: 'blur(50px)',
                        }}
                    />
                )}

                {/* Grain — visible, tactile */}
                <div
                    className="pointer-events-none absolute inset-0 z-10 opacity-50 mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        backgroundSize: '256px 256px',
                    }}
                />

                {/* Album art — tighter radius, no glow */}
                <div className="relative shrink-0">
                    {data.albumArt ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden ring-1 ring-white/[0.06]">
                            <Image
                                src={data.albumArt}
                                alt={`${data.title} album art`}
                                fill
                                className="object-cover"
                                sizes="48px"
                            />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/[0.04] flex items-center justify-center ring-1 ring-white/[0.06]">
                            <svg className="w-5 h-5 text-zinc-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Track info — flat, confident typography */}
                <div className="min-w-0 flex-1 z-20">
                    <p className="text-zinc-100 font-medium text-[13px] tracking-[-0.01em] truncate group-hover:text-white transition-colors">
                        {data.title}
                    </p>
                    <p className="text-zinc-500 text-[12px] tracking-[0.01em] truncate mt-0.5">{data.artist}</p>
                </div>

                {/* Right — glass icons */}
                <div className="shrink-0 flex flex-col items-center gap-2.5 z-20">
                    <SpotifyIcon className="w-5 h-5 text-white/25" />
                    {data.isPlaying && <Equalizer />}
                </div>
            </a>
        </div>
    );
}
