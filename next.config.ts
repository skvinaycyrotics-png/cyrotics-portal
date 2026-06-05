// ─────────────────────────────────────────────────────────────────────────────
// FILE: next.config.ts  (UPDATED for main website cyrotics.in)
//
// CRITICAL CHANGE: Removed `output: 'export'`
//
// WHY: `output: 'export'` generates static HTML at build time only.
// This means live CMS data (testimonials, blogs, jobs, projects) would
// NEVER update without a full rebuild. With ISR (Incremental Static
// Regeneration), pages are statically generated at build time but
// automatically revalidated in the background on a schedule — so
// content added via the admin panel appears on the website within
// minutes without any deployment.
//
// DEPLOYMENT CHANGE:
//   BEFORE: Vercel was hosting the output as a static site
//   AFTER:  Vercel runs the Next.js server (this is the default Vercel mode)
//   ACTION NEEDED: In Vercel → Settings → Framework Preset → "Next.js"
//                  (remove any "Static" override if present)
//
// Security headers that were previously handled by vercel.json still work —
// Vercel applies them regardless of server vs static mode.
// ─────────────────────────────────────────────────────────────────────────────

import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // REMOVED: output: 'export'  ← this was blocking live CMS data
  // Vercel handles server-side rendering natively — no change needed there.

  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  typescript: {
    // Keep false — don't silently swallow TS errors
    ignoreBuildErrors: false,
  },

  compiler: {
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },

  experimental: {
    optimizeCss: true,
  },

  images: {
    // No longer needs unoptimized:true — Next.js image optimization works in server mode
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      // Allow images from your backend/CDN if you store uploads there:
      // { protocol: 'https', hostname: 'cyrotics-backend.onrender.com' },
    ],
  },
};

export default nextConfig;
