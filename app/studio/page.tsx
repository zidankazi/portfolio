import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Undo2 } from 'lucide-react';
import { AmbientBackdrop } from '@/components/ambient/AmbientBackdrop';
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
    image: '/studio/omu-page.webp',
    decoration: '/studio/pushpin-photo.png',
    position: 'left',
  },
  {
    name: 'Relic',
    domain: 'tryrelic.io',
    href: 'https://tryrelic.io/',
    image: '/studio/relic.webp',
    decoration: '/studio/binderclip-photo.png',
    position: 'center',
  },
  {
    name: 'Mille Works',
    domain: 'noble-square-275817.framer.app',
    href: 'https://noble-square-275817.framer.app/',
    image: '/studio/mille-works-page.webp',
    decoration: '/studio/safety-pin-photo.png',
    position: 'right',
  },
] as const;

export default function StudioPage() {
  return (
    <main className={styles.studio}>
      <AmbientBackdrop />
      <Link href="/" className={styles.back}>
        <Undo2 size={16} aria-hidden="true" />
        back to the conversation
      </Link>
      <h1 className="sr-only">Studio, websites by Zidan Kazi</h1>

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
                  sizes="(max-width: 540px) 290px, 340px"
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
                sizes="130px"
                priority
                className={styles.decoration}
              />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
