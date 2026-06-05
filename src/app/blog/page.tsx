// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/app/blog/page.tsx  — cyrotics.in/blog
// SERVER COMPONENT with ISR. Works with output: 'export' only if you switch
// the main website to server-side rendering (recommended for this feature).
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogs } from '@/lib/cms';
import { Calendar, Tag, TrendingUp, ArrowRight, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog — Technology Insights & IT News',
  description: 'Read the latest articles on enterprise IT infrastructure, cybersecurity, AI automation, data centers, and digital transformation from the Cyrotics team.',
  alternates: { canonical: 'https://www.cyrotics.in/blog/' },
  openGraph: {
    url: 'https://www.cyrotics.in/blog/',
    title: 'Blog | Cyrotics Technologies',
  },
};

// ISR: revalidate every 15 minutes
export const revalidate = 900;

export default async function BlogPage({ searchParams }: { searchParams?: { page?: string; category?: string } }) {
  const page = Number(searchParams?.page ?? 1);
  const category = searchParams?.category;

  const { blogs, pages } = await getBlogs(page, 9, category);

  const CATEGORIES = ['Technology', 'Cybersecurity', 'Cloud Computing', 'Networking', 'Data Center', 'AI & ML', 'Case Studies'];

  return (
    <main className="w-full">
      {/* Hero */}
      <section className="py-20 text-center bg-primary/5 border-b border-border/50">
        <div className="container">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Technology Insights
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Expert articles on enterprise IT, cybersecurity, AI, and digital transformation.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 sm:px-6">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            <Link href="/blog" className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${!category ? 'bg-brand text-white border-brand' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}>
              All
            </Link>
            {CATEGORIES.map(c => (
              <Link key={c} href={`/blog?category=${encodeURIComponent(c)}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${category === c ? 'bg-brand text-white border-brand' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}>
                {c}
              </Link>
            ))}
          </div>

          {/* Blog grid */}
          {blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <FileText className="h-14 w-14 mb-4 opacity-30" />
              <p className="text-xl font-medium mb-2">No posts yet</p>
              <p className="text-sm">Check back soon for new articles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {blogs.map(blog => (
                <Link key={blog._id} href={`/blog/${blog.slug}`}
                  className="group flex flex-col rounded-3xl border border-border bg-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  {/* Cover */}
                  {blog.coverImage ? (
                    <div className="relative h-44 overflow-hidden bg-muted">
                      <Image src={blog.coverImage} alt={blog.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-brand/10 to-indigo-500/10 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-brand/30" />
                    </div>
                  )}

                  <div className="flex flex-col flex-1 p-5 gap-3">
                    {/* Category & date */}
                    <div className="flex items-center justify-between">
                      {blog.category && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand">
                          {blog.category}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto">
                        <Calendar className="h-3 w-3" />
                        {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="font-headline text-base font-bold leading-snug group-hover:text-brand transition-colors line-clamp-2 flex-1">
                      {blog.title}
                    </h2>

                    {/* Excerpt */}
                    {blog.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{blog.excerpt}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> {blog.views} views
                      </span>
                      <span className="text-xs text-brand font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read more <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <Link key={p} href={`/blog?page=${p}${category ? `&category=${encodeURIComponent(category)}` : ''}`}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium border transition-all ${p === page ? 'bg-brand text-white border-brand' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
