'use client';

import Image from 'next/image';
import { ChatBubble } from './ChatBubble';

const APPLE_MAPS_URL = 'https://maps.apple.com/?q=Hoboken, NJ';

export function MapWidget() {
    return (
        <div className="flex flex-col gap-3">
            {/* Map card — aligned with bubble content */}
            <div className="ml-11">
                <a
                    href={APPLE_MAPS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="relative block h-[260px] w-full overflow-hidden rounded-[20px] cursor-pointer"
                >
                    {/* Map image */}
                    <Image
                        src="/hoboken_map.png"
                        alt="Map of Hoboken, NJ"
                        fill
                        className="object-cover"
                        quality={100}
                    />

                    {/* Ping — lime green, exactly like alistair.sh */}
                    <span className="absolute top-1/2 left-1/2 z-10 -mt-7 -ml-7 block size-14 animate-[ping_2s_cubic-bezier(0,_0,_0.2,_1)_infinite] rounded-full bg-lime-500" />

                    {/* Avatar */}
                    <div className="absolute top-1/2 left-1/2 z-10 size-16 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-white">
                        <Image
                            src="/avatar.jpeg"
                            alt="Location avatar"
                            fill
                            className="object-cover"
                        />
                    </div>
                </a>
            </div>

            {/* Location bubble */}
            <ChatBubble>
                <span>
                    I'm currently in{' '}
                    <a
                        href={APPLE_MAPS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 decoration-white/30 hover:decoration-white/70 transition-colors"
                    >
                        Hoboken, NJ
                    </a>{' '}
                    📍
                </span>
            </ChatBubble>
        </div>
    );
}
