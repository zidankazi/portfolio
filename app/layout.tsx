import type { Metadata } from 'next';
import { Inter, Newsreader, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

// Gossip by Deborah Khodanovich (https://dvorit.ca) — SIL OFL 1.1, see ./fonts/Gossip-LICENSE.txt
const displayFont = localFont({
  src: './fonts/Gossip-HighCrossSmall.woff2',
  variable: '--font-display',
  weight: '200',
  display: 'swap'
});

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

export const metadata: Metadata = {
  title: 'zidan kazi',
  description: 'builder portfolio of zidan kazi',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' }
    ]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable} ${monoFont.variable} ${displayFont.variable} h-full bg-[#0a0a0a]`}>
      <body className="bg-[#0a0a0a] font-body text-zinc-300 selection:bg-zinc-800 selection:text-white min-h-full antialiased flex flex-col items-center pt-14 sm:pt-20 pb-24 px-5 sm:px-10">
        <div className="w-full max-w-[520px] flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
