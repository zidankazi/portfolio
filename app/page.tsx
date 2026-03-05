import Image from 'next/image';
import { projects } from '@/data/projects';
import { IntroBubble } from '@/components/chat/IntroBubble';
import { MapWidget } from '@/components/chat/MapWidget';
import { ProjectsSection } from '@/components/chat/ProjectsSection';
import { Pill } from '@/components/chat/Pill';
import { SpotifyCard } from '@/components/chat/SpotifyCard';
import { StaggerContainer, StaggerItem, StaggerGroup } from '@/components/motion/Stagger';
import { Github, Twitter, Mail } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="w-full flex justify-center pb-6 font-body mt-2">
      <div className="flex flex-col gap-5 w-full">

        {/* Intro — self-animated with enlarged name */}
        <IntroBubble />

        {/* Remaining sections cascade with blur+fade */}
        <StaggerContainer className="contents" stagger={0.15} delay={0.6}>

          {/* Now playing */}
          <StaggerItem>
            <SpotifyCard />
          </StaggerItem>

          {/* Projects */}
          <StaggerItem>
            <ProjectsSection projects={projects} />
          </StaggerItem>

          {/* Map */}
          <StaggerItem>
            <MapWidget />
          </StaggerItem>

          {/* Links — each pill cascades individually */}
          <StaggerGroup className="flex flex-col gap-2 ml-11" stagger={0.08}>
            <StaggerItem>
              <Pill isPrefix href="#">
                Find me online:
              </Pill>
            </StaggerItem>
            <StaggerItem>
              <Pill href="https://github.com/zidankazi" icon={<Github className="w-3.5 h-3.5" />}>
                I&apos;m @zidankazi on GitHub
              </Pill>
            </StaggerItem>
            <StaggerItem>
              <Pill href="https://twitter.com/zidaaaaaaaannnn" icon={<Twitter className="w-3.5 h-3.5" />}>
                I&apos;m @zidaaaaaaaannnn on Twitter/X
              </Pill>
            </StaggerItem>
          </StaggerGroup>

          {/* Email row with avatar */}
          <StaggerItem>
            <div className="flex items-end gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                <Image
                  src="/avatar.jpeg"
                  alt="Zidan Kazi"
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <Pill href="mailto:zidankazi01@outlook.com" icon={<Mail className="w-3.5 h-3.5" />}>
                Shoot me an email — zidankazi01 [at] outlook.com
              </Pill>
            </div>
          </StaggerItem>

        </StaggerContainer>

      </div>
    </main>
  );
}
