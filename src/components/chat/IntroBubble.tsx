import Image from 'next/image';

export function IntroBubble() {
  return (
    <div className="flex gap-3 items-end sm:items-start group w-full">
      <div className="shrink-0 w-8 flex justify-center">
        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1">
          <Image src="/avatar.jpeg" alt="Zidan Kazi" fill className="object-cover" sizes="32px" />
        </div>
      </div>
      <div
        data-puppet-anchor="intro"
        className="bg-[#161618] text-[#d4d4d4] rounded-[20px] rounded-tl-sm px-4 py-3 text-[14px] leading-[1.6] border border-white/5 shadow-sm w-full"
      >
        <p>
          I&apos;m <i className="font-heading text-white text-[20px]">Zidan</i>, a junior at{' '}
          <a
            href="https://www.stevens.edu/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 decoration-white/30 hover:decoration-white/70 transition-colors"
          >
            Stevens Institute of Technology
          </a>{' '}
          studying Computer Science &amp; Math.
        </p>
      </div>
    </div>
  );
}
