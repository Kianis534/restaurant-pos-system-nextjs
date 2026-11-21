import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

// Built once into out/manifest.webmanifest. Paths inside a manifest aren't rewritten by
// Next.js, so the base path (e.g. /restaurant-pos-system-nextjs on GitHub Pages) is added here.
export const dynamic = 'force-static';

// Same normalisation as next.config.ts: leading slash, no trailing slash.
const rawBase = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').trim().replace(/\/+$/, '');
const base = rawBase && !rawBase.startsWith('/') ? `/${rawBase}` : rawBase;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.appName,
    short_name: 'POS',
    description: 'Restaurant point of sale: dine-in and takeaway orders, kitchen display, receipts and reports.',
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    background_color: '#f3f4f6',
    theme_color: '#2563eb',
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${base}/icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${base}/icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
