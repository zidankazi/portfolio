import type { ReactNode } from 'react';
import { AmbientBackdrop } from '@/components/ambient/AmbientBackdrop';
import { SigilRails } from '@/components/ambient/SigilRails';
import { PuppetHands } from '@/components/ambient/PuppetHands';
import { Entrance } from '@/components/motion/Entrance';

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center pt-[190px] sm:pt-[220px] lg:pt-64 pb-16 sm:pb-24 px-4 sm:px-10">
      <AmbientBackdrop />
      <Entrance>
        <SigilRails />
        <PuppetHands />
        <div className="w-full max-w-[520px] flex flex-col">
          {children}
        </div>
      </Entrance>
    </div>
  );
}
