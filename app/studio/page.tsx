import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, House } from 'lucide-react';
import { StudioClock } from '@/components/studio/StudioClock';
import styles from './studio.module.css';

export const metadata: Metadata = {
  title: 'studio · zidan kazi',
  description: 'A few websites I have built: OMU, Relic, and Mille Works.',
};

const sites = [
  {
    name: 'OMU',
    domain: 'omu.food',
    href: 'https://omu.food/',
    image: '/studio/omu.webp',
    decoration: '/studio/pushpin.webp',
    position: 'left',
  },
  {
    name: 'Relic',
    domain: 'tryrelic.io',
    href: 'https://tryrelic.io/',
    image: '/projects/relic-loop-poster.webp',
    decoration: '/studio/binderclip.webp',
    position: 'center',
  },
  {
    name: 'Mille Works',
    domain: 'noble-square-275817.framer.app',
    href: 'https://noble-square-275817.framer.app/',
    image: '/studio/mille-works.webp',
    decoration: '/studio/cursor.webp',
    position: 'right',
  },
] as const;

export default function StudioPage() {
  return (
    <main className={styles.studio}>
      <h1 className="sr-only">Studio, websites by Zidan Kazi</h1>

      <nav className={styles.navigation} aria-label="Pages">
        <Link href="/" className={styles.navLink} aria-label="Back to the conversation">
          <House size={17} strokeWidth={2} aria-hidden="true" />
          <span className={styles.tooltip}>home</span>
        </Link>
        <Link href="/studio" className={`${styles.navLink} ${styles.current}`} aria-label="Studio" aria-current="page">
          <BriefcaseBusiness size={18} strokeWidth={2} aria-hidden="true" />
          <span className={styles.tooltip}>studio</span>
        </Link>
      </nav>

      <section className={styles.work} aria-label="Selected websites">
        <div className={styles.stack}>
          {sites.map((site) => (
            <a
              key={site.name}
              href={site.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.project} ${styles[site.position]}`}
              aria-label={`Visit ${site.name} (opens in a new tab)`}
            >
              <div className={styles.card}>
                <Image
                  src={site.image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 540px) 290px, 260px"
                  className={styles.artwork}
                />
                <div className={styles.shade} />
                <div className={styles.texture} />
                <div className={styles.label}>
                  <span className={styles.name}>{site.name}</span>
                  <span className={styles.domain}>{site.domain}</span>
                </div>
                <ArrowUpRight className={styles.visit} size={17} aria-hidden="true" />
              </div>
              <Image
                src={site.decoration}
                alt=""
                aria-hidden="true"
                width={90}
                height={110}
                sizes="90px"
                priority
                className={styles.decoration}
              />
            </a>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <a href="mailto:zidankazi01@outlook.com">let&apos;s make something.</a>
        <StudioClock />
      </footer>
    </main>
  );
}
