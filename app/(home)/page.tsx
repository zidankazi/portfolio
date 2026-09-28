import Image from 'next/image';
import Link from 'next/link';
import { projects } from '@/data/projects.server';
import { IntroBubble } from '@/components/chat/IntroBubble';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { MapWidget } from '@/components/chat/MapWidget';
import { ProjectsSection } from '@/components/chat/ProjectsSection';
import { Pill } from '@/components/chat/Pill';
import { SpotifyCard } from '@/components/chat/SpotifyCard';
import { ScrollCue } from '@/components/chat/ScrollCue';
import { ArrowUpRight, Github, Twitter, Mail } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="w-full flex justify-center pb-6 font-body mt-2">
      <div className="flex flex-col gap-5 w-full">

        {/* The conversation and strings share one entrance. */}
        <IntroBubble />

        <SpotifyCard />
        <ChatBubble>
          <Link
            href="/studio"
            className="group/studio block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-400"
          >
            <span>I make websites.</span>
            <span className="mt-1 flex items-center gap-1 text-zinc-400 transition-colors group-hover/studio:text-zinc-100">
              Come take a look
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>
        </ChatBubble>
        <ProjectsSection projects={projects} />
        <MapWidget />

        {/* Links */}
        <div className="flex flex-col gap-2 ml-8 sm:ml-11">
          <Pill isPrefix href="#">
            Find me online:
          </Pill>
          <Pill href="https://github.com/zidankazi" icon={<Github className="w-3.5 h-3.5" />}>
            I&apos;m @zidankazi on GitHub
          </Pill>
          <Pill href="https://twitter.com/zidaaaaaaaannnn" icon={<Twitter className="w-3.5 h-3.5" />}>
            I&apos;m @zidaaaaaaaannnn on Twitter/X
          </Pill>
        </div>

        {/* Email row with avatar */}
        <div className="flex items-end gap-2 sm:gap-3">
          <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0">
            <Image
              src="/avatar.jpeg"
              alt="Zidan Kazi"
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>
          <Pill href="mailto:hi@zidankazi.com" icon={<Mail className="w-3.5 h-3.5" />}>
            Shoot me an email — hi [at] zidankazi [dot] com
          </Pill>
        </div>

      </div>

      {/* "there's more below" nudge — shows while content sits under the fold */}
      <ScrollCue />
    </main>
  );
}
