// ─────────────────────────────────────────────────────────────────────────────
// Server-side CMS fetchers for cyrotics.in
// These run at build time (SSG) or request time (SSR/ISR).
// Place this file at: src/lib/cms.ts
// ─────────────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'https://cyrotics-backend.onrender.com/api';

// Generic fetcher with error handling and Next.js cache tags
async function apiFetch<T>(path: string, revalidate = 3600): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      next: {
        revalidate, // ISR: revalidate every hour by default
        tags: [path.split('?')[0].replace(/\//g, '-').slice(1)],
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`CMS fetch error [${path}]:`, err);
    return null;
  }
}

// ── Testimonials ──────────────────────────────────────────────────────────────
export interface Testimonial {
  _id: string; name: string; company?: string; designation?: string;
  message: string; rating: number; avatar?: string; order: number;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const data = await apiFetch<{ data: { testimonials: Testimonial[] } }>(
    '/cms/testimonials?published=true', 3600
  );
  return data?.data?.testimonials ?? [];
}

// ── Jobs ──────────────────────────────────────────────────────────────────────
export interface Job {
  _id: string; title: string; slug: string; department?: string;
  location?: string; type: string; experience?: string; salary?: string;
  description: string; requirements: string[]; responsibilities: string[];
  closingDate?: string; createdAt: string;
}

export async function getJobs(): Promise<Job[]> {
  const data = await apiFetch<{ data: Job[] }>('/cms/jobs?published=true&limit=20', 1800);
  return data?.data ?? [];
}

export async function getJob(slug: string): Promise<Job | null> {
  const data = await apiFetch<{ data: { job: Job } }>(`/cms/jobs/${slug}`, 3600);
  return data?.data?.job ?? null;
}

// ── Blogs ─────────────────────────────────────────────────────────────────────
export interface BlogPost {
  _id: string; title: string; slug: string; excerpt?: string;
  content: string; coverImage?: string; tags: string[];
  category?: string; publishedAt?: string; views: number;
  metaTitle?: string; metaDescription?: string;
  author: { name: string };
}

export interface BlogListItem extends Omit<BlogPost, 'content'> { }

export async function getBlogs(page = 1, limit = 9, category?: string): Promise<{
  blogs: BlogListItem[]; total: number; pages: number;
}> {
  const params = new URLSearchParams({
    published: 'true', page: String(page), limit: String(limit),
    ...(category && { category }),
  });
  const data = await apiFetch<{ data: BlogListItem[]; pagination: { total: number; pages: number } }>(
    `/cms/blogs?${params}`, 900
  );
  return {
    blogs: data?.data ?? [],
    total: data?.pagination?.total ?? 0,
    pages: data?.pagination?.pages ?? 0,
  };
}

export async function getBlog(slug: string): Promise<BlogPost | null> {
  const data = await apiFetch<{ data: { blog: BlogPost } }>(`/cms/blogs/${slug}`, 3600);
  return data?.data?.blog ?? null;
}

// ── Social Links ──────────────────────────────────────────────────────────────
export interface SocialLink {
  _id: string; platform: string; url: string; icon: string; order: number;
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  const data = await apiFetch<{ data: { links: SocialLink[] } }>('/cms/social-links', 3600);
  return data?.data?.links ?? [];
}

// ── Website projects (showcase) ───────────────────────────────────────────────
export interface ShowcaseProject {
  _id: string; name: string; slug: string; shortDescription?: string;
  tags: string[]; imageUrl?: string; imageHint?: string;
  category?: string; status: string;
}

export async function getShowcaseProjects(limit = 6): Promise<ShowcaseProject[]> {
  const data = await apiFetch<{ data: ShowcaseProject[] }>(
    `/projects?showOnWebsite=true&limit=${limit}`, 3600
  );
  return data?.data ?? [];
}
