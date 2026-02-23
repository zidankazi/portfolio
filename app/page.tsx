import { projects } from '@/data/projects';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { MapWidget } from '@/components/chat/MapWidget';
import { ProjectsSection } from '@/components/chat/ProjectsSection';
import { Pill } from '@/components/chat/Pill';
import { SpotifyCard } from '@/components/chat/SpotifyCard';
import { Github, Twitter, Mail } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="w-full flex justify-center pb-6 font-body mt-2">
      <div className="flex flex-col gap-5 w-full">

        {/* Intro */}
        <ChatBubble>
          <p>
            I'm <i className="font-heading text-white">Zidan</i>, a sophomore at Stevens Institute of Technology studying Computer Science. I'm a builder exploring distributed systems, local AI, and heavily engineered interfaces. It's nice to meet you.
          </p>
        </ChatBubble>

        {/* Now playing */}
        <SpotifyCard />

        {/* Projects */}
        <ProjectsSection projects={projects} />

        {/* Map */}
        <MapWidget />

        {/* Links */}
        <div className="flex flex-col gap-2 ml-11">
          <Pill isPrefix href="#">
            Find me online:
          </Pill>
          <Pill href="https://github.com/zidankazi" icon={<Github className="w-3.5 h-3.5" />}>
            I'm @zidankazi on GitHub
          </Pill>
          <Pill href="https://twitter.com/zidaaaaaaaannnn" icon={<Twitter className="w-3.5 h-3.5" />}>
            I'm @zidaaaaaaaannnn on Twitter/X
          </Pill>
          <Pill href="mailto:zidankazi01@outlook.com" icon={<Mail className="w-3.5 h-3.5" />}>
            Shoot me an email — zidankazi01 [at] outlook.com
          </Pill>
        </div>

      </div>
    </main>
  );
}
