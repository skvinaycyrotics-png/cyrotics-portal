// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/app/sitemap.ts
//
// Auto-generated sitemap that includes static pages + all blog posts + all jobs
// fetched live from the database. Vercel/Next.js serves this at /sitemap.xml
// ─────────────────────────────────────────────────────────────────────────────

import { MetadataRoute } from 'next';
import { getBlogs, getJobs } from '@/lib/cms';

export const revalidate = 3600; // regenerate sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = 'https://www.cyrotics.in';
  const now = new Date();

  // ── Static pages ───────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/services/`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/projects/`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/blog/`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/careers/`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/contact/`, lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${BASE}/faqs/`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  // ── Blog posts ─────────────────────────────────────────────────────────────
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const { blogs } = await getBlogs(1, 200);
    blogEntries = blogs.map(b => ({
      url: `${BASE}/blog/${b.slug}/`,
      lastModified: b.publishedAt ? new Date(b.publishedAt) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch { /* ignore — sitemap still works without blog entries */ }

  // ── Job listings ──────────────────────────────────────────────────────────
  let jobEntries: MetadataRoute.Sitemap = [];
  try {
    const jobs = await getJobs();
    jobEntries = jobs.map(j => ({
      url: `${BASE}/careers/${j.slug}/`,
      lastModified: new Date(j.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch { /* ignore */ }

  return [...staticPages, ...blogEntries, ...jobEntries];
}
