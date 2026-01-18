'use client';

import Link from 'next/link';
import { profile } from '@/data/profile';

export const Nav = () => {
  return (
    <nav className="flex items-center justify-between py-6">
      <Link href="/" className="text-sm font-semibold tracking-[0.4em] text-ink-100">
        {profile.name}
      </Link>
      <div className="flex flex-wrap items-center gap-4 text-xs tracking-[0.25em] text-chrome-400">
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
