// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/app/page.tsx  (UPDATED — replaces previous version)
//
// KEY CHANGE: The homepage is now a SERVER component that imports:
//   - TestimonialsSection (live from DB)
//   - LiveProjectsSection (live from DB)
//   - HomeClient (all 'use client' UI, no change)
//
// IMPORTANT: Keep the 'use client' code in home-client.tsx (from the
// previous fix package). Only this file changes.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import { SITE_URL } from '@/app/layout';
import HomeClient from './home-client';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import LiveProjectsSection from '@/components/sections/LiveProjectsSection';

export const metadata: Metadata = {
  title: 'Enterprise IT Infrastructure, AI Automation & Cybersecurity Solutions',
  description:
    'Cyrotics delivers mission-critical IT infrastructure, AI automation, cybersecurity, data center, networking, and smart building solutions across India.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    title: 'Cyrotics — Enterprise IT Infrastructure & AI Automation',
    description: 'Mission-critical IT infrastructure, AI automation, cybersecurity, data center, networking, and digital transformation solutions across India.',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
};

// ISR: revalidate homepage every hour (picks up new projects/testimonials)
export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      {/* ── All original client-side homepage sections ─────────────────────── */}
      {/* Hero, Services bento, Why Choose Us, Stats counter */}
      <HomeClient />

      {/* ── Live data sections (server-rendered from DB) ────────────────────── */}
      {/* Projects showcase — pulled from projects with showOnWebsite: true */}
      <LiveProjectsSection />

      {/* Testimonials — pulled from published testimonials in DB */}
      <TestimonialsSection />
    </>
  );
}
