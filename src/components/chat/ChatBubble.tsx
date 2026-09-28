'use client';

import Image from 'next/image';
import { ReactNode } from 'react';

interface ChatBubbleProps {
    children: ReactNode;
    showAvatar?: boolean;
    compact?: boolean;
}

export function ChatBubble({ children, showAvatar = true, compact = false }: ChatBubbleProps) {
    return (
        <div className="flex gap-2 sm:gap-3 items-start group w-full">
            {/* Avatar */}
            <div className="shrink-0 w-6 sm:w-8 flex justify-center">
                {showAvatar ? (
                    <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 mt-1">
                        <Image
                            src="/avatar.jpeg"
                            alt="Zidan Kazi"
                            fill
                            className="object-cover"
                            sizes="32px"
                        />
                    </div>
                ) : (
                    <div className="w-6 sm:w-8" />
                )}
            </div>

            {/* Bubble */}
            <div data-puppet-anchor="bubble" className={`min-w-0 bg-[#161618] text-[#d4d4d4] rounded-[20px] rounded-tl-sm px-4 py-3 text-[14px] leading-[1.6] border border-white/5 shadow-sm ${compact ? 'w-fit' : 'w-full'}`}>
                {children}
            </div>
        </div>
    );
}
