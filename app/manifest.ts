import type { MetadataRoute } from 'next';
import { manifest as siteManifest } from '@/data/site.server';

export default function manifest(): MetadataRoute.Manifest {
  return siteManifest;
}
