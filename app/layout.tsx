import { metadata as siteMetadata } from '@/data/site.server';
import { PageTransitions } from '@/components/motion/PageTransitions';
import { Inter, Newsreader, JetBrains_Mono } from 'next/font/google';
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
      <body className="font-body text-zinc-300 selection:bg-zinc-800 selection:text-white min-h-full antialiased">
        <PageTransitions>{children}</PageTransitions>
      </body>
    </html>
  );
}
