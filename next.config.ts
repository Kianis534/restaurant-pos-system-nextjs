import type { NextConfig } from 'next';

/**
 * The app keeps all its data in the browser, so it builds to plain static files (`out/`)
 * that any static host can serve.
 *
 * NEXT_PUBLIC_BASE_PATH is only needed when the site lives in a sub-folder, e.g.
 * GitHub Pages project sites: https://<user>.github.io/<repo>/ -> NEXT_PUBLIC_BASE_PATH=/<repo>
 */
const rawBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').trim().replace(/\/+$/, '');
const basePath = rawBasePath && !rawBasePath.startsWith('/') ? `/${rawBasePath}` : rawBasePath;

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath || undefined,
  // Emit /admin/products/index.html instead of /admin/products.html so every route works
  // on hosts that don't do extension-less rewrites.
  trailingSlash: true,
  images: { unoptimized: true },
  reactCompiler: true,
  poweredByHeader: false,
};

export default nextConfig;
