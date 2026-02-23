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
            className="flex items-center gap-2 bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/5 hover:border-white/10 text-zinc-300 transition-colors text-[14px] px-4 py-2 rounded-full w-fit"
        >
            {children}
            {icon && <span className="text-zinc-500">{icon}</span>}
        </Link>
    );
}
