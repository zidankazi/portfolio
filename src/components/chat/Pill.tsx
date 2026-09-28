'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface PillProps {
    href: string;
    icon?: ReactNode;
    children: ReactNode;
    isPrefix?: boolean;
}

export function Pill({ href, icon, children, isPrefix }: PillProps) {
    if (isPrefix) {
        return (
            <div className="bg-[#1C1C1E] border border-white/5 text-[#A0A0A0] text-[14px] px-4 py-2 rounded-full w-fit">
                {children}
            </div>
        );
    }

    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 max-w-full min-h-11 sm:min-h-0 items-center gap-2 bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/5 hover:border-white/10 text-zinc-300 transition-colors text-[14px] px-4 py-2 rounded-[22px] sm:rounded-full w-fit"
        >
            <span className="min-w-0 break-words">{children}</span>
            {icon && <span className="shrink-0 text-zinc-500">{icon}</span>}
        </Link>
    );
}
