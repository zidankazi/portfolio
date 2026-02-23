'use client';

import Link from 'next/link';

export const Nav = () => {
  return (
    <nav className="flex items-center justify-between pb-12 pt-4">
      <Link href="/" className="font-heading italic text-xl font-medium tracking-tight text-anthropic-text hover:text-anthropic-text/70 transition-colors">
        zidan kazi
      </Link>
      <div className="flex items-center gap-6 text-sm text-anthropic-text/60">
        <Link href="/" className="transition-colors hover:text-anthropic-text">
          work
        </Link>
        <Link href="/notes" className="transition-colors hover:text-anthropic-text">
          notes
        </Link>
        <a href="https://github.com/zidank6" className="transition-colors hover:text-anthropic-text" target="_blank" rel="noreferrer">
          github
        </a>
      </div>
    </nav>
  );
};
