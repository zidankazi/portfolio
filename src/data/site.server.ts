import 'server-only';
import type { Metadata, MetadataRoute } from 'next';
import { metadata_json, manifest_json } from '../../build/dev/javascript/portfolio/data/site.mjs';

export const metadata: Metadata = JSON.parse(metadata_json());
export const manifest: MetadataRoute.Manifest = JSON.parse(manifest_json());
