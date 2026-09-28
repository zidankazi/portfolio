import { metadata as siteMetadata } from '@/data/site.server';
import { Inter, Newsreader, JetBrains_Mono } from 'next/font/google';
import { AmbientBackdrop } from '@/components/ambient/AmbientBackdrop';
import { SigilRails } from '@/components/ambient/SigilRails';
import { PuppetHands } from '@/components/ambient/PuppetHands';
import { Entrance } from '@/components/motion/Entrance';
import './globals.css';

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600']
});

const headingFont = Newsreader({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic']
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata = siteMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable} ${monoFont.variable} h-full bg-[#0a0a0a]`}>
      {/* No bg on body — it would paint over the -z-10 ambient backdrop; html carries the color */}
      <body className="font-body text-zinc-300 selection:bg-zinc-800 selection:text-white min-h-full antialiased flex flex-col items-center pt-[190px] sm:pt-[220px] lg:pt-64 pb-16 sm:pb-24 px-4 sm:px-10">
        {/* Album-palette wash — tints the page to whatever's playing */}
        <AmbientBackdrop />
        <Entrance>
          {/* Generative ASCII sigil linework crawling up the page edges */}
          <SigilRails />
          <PuppetHands />
          <div className="w-full max-w-[520px] flex flex-col">
            {children}
          </div>
        </Entrance>
      </body>
    </html>
  );
}
