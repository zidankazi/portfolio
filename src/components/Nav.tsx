'use client';

import Link from 'next/link';
import { profile } from '@/data/profile';

export const Nav = () => {
  return (
    <nav className="flex flex-col items-center gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-6">
      <Link href="/" className="text-sm font-semibold tracking-[0.4em] text-ink-100">
        {profile.name}
      </Link>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] tracking-[0.2em] text-chrome-400 sm:text-xs sm:tracking-[0.25em]">
        <Link href="/projects" className="transition hover:text-ink-100">
          projects
        </Link>
        <Link href="/skills" className="transition hover:text-ink-100">
          skills
        </Link>
        <Link href="/contact" className="transition hover:text-ink-100">
          contact
        </Link>
        <a
          href={profile.github}
          className="transition hover:text-ink-100"
          target="_blank"
          rel="noreferrer"
        >
          github
        </a>
        <a
          href={profile.linkedin}
          className="transition hover:text-ink-100"
          target="_blank"
          rel="noreferrer"
        >
          linkedin
        </a>
        <a
          href={profile.twitter}
          className="transition hover:text-ink-100"
          target="_blank"
          rel="noreferrer"
        >
          twitter
        </a>
      </div>
    </nav>
  );
};
