// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/app/blog/[slug]/page.tsx  — cyrotics.in/blog/:slug
// SERVER COMPONENT with ISR + dynamic metadata per post.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBlog, getBlogs } from '@/lib/cms';
import { Calendar, Clock, ArrowLeft, Tag, TrendingUp, User } from 'lucide-react';

export const revalidate = 3600; // ISR: revalidate hourly

// ── Generate static paths for published posts ─────────────────────────────────
export async function generateStaticParams() {
  const { blogs } = await getBlogs(1, 100);
  return blogs.map(b => ({ slug: b.slug }));
}

// ── Per-post SEO metadata ─────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const blog = await getBlog(params.slug);
  if (!blog) return { title: 'Post not found' };

  const url = `https://www.cyrotics.in/blog/${blog.slug}/`;
  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt || `Read ${blog.title} on the Cyrotics Technologies blog.`,
    alternates: { canonical: url },
    openGraph: {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt,
      url,
      type: 'article',
      publishedTime: blog.publishedAt,
      tags: blog.tags,
      images: blog.coverImage ? [{ url: blog.coverImage, width: 1200, height: 630, alt: blog.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt,
      images: blog.coverImage ? [blog.coverImage] : undefined,
    },
  };
}

// ── Simple markdown → HTML ────────────────────────────────────────────────────
function renderMarkdown(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/---/g, '<hr />')
    .replace(/(<li>[\s\S]+?<\/li>)(\n)(?!<li>)/g, '<ul>$1</ul>')
    .split(/\n\n+/)
    .map(block => {
      if (block.match(/^<(h[1-6]|ul|ol|blockquote|pre|hr)/)) return block;
      if (block.trim() === '') return '';
      return `<p>${block.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');
}

// ── Estimate read time ────────────────────────────────────────────────────────
function readTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
}

// ── Article structured data ───────────────────────────────────────────────────
function articleSchema(blog: Awaited<ReturnType<typeof getBlog>>) {
  if (!blog) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.metaDescription || blog.excerpt,
    image: blog.coverImage,
    datePublished: blog.publishedAt,
    author: { '@type': 'Organization', name: 'Cyrotics Technologies', url: 'https://www.cyrotics.in' },
    publisher: {
      '@type': 'Organization',
      name: 'Cyrotics Technologies',
      logo: { '@type': 'ImageObject', url: 'https://www.cyrotics.in/favicon.ico' },
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const blog = await getBlog(params.slug);
  if (!blog) notFound();

  const schema = articleSchema(blog);

  return (
    <main className="w-full">
      {/* Structured data */}
      {schema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      )}

      {/* Hero */}
      <section className="py-16 border-b border-border/50">
        <div className="container px-4 sm:px-6 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{blog.title}</span>
          </nav>

          {/* Category */}
          {blog.category && (
            <Link href={`/blog?category=${encodeURIComponent(blog.category)}`}
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-brand/10 text-brand mb-4 hover:bg-brand/20 transition-all">
              {blog.category}
            </Link>
          )}

          {/* Title */}
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
            {blog.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {blog.author?.name || 'Cyrotics Team'}
            </span>
            {blog.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {readTime(blog.content)} min read
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> {blog.views} views
            </span>
          </div>

          {/* Cover image */}
          {blog.coverImage && (
            <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden mb-8">
              <Image src={blog.coverImage} alt={blog.title} fill className="object-cover" priority />
            </div>
          )}
        </div>
      </section>

      {/* Article body */}
      <section className="py-12">
        <div className="container px-4 sm:px-6 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12">
            {/* Content */}
            <article>
              <div
                className="prose prose-lg dark:prose-invert max-w-none
                  prose-headings:font-headline prose-headings:font-bold
                  prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                  prose-p:text-foreground/80 prose-p:leading-relaxed
                  prose-a:text-brand prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
                  prose-pre:bg-slate-900 prose-pre:text-slate-200 prose-pre:rounded-2xl prose-pre:p-5
                  prose-blockquote:border-l-4 prose-blockquote:border-brand prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
                  prose-img:rounded-2xl prose-img:shadow-lg
                  prose-hr:border-border"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(blog.content) }}
              />

              {/* Tags */}
              {blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-border">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                  {blog.tags.map(tag => (
                    <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 rounded-full text-sm bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Back link */}
              <div className="mt-10">
                <Link href="/blog"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to all posts
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* About the author */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">About</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    C
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Cyrotics Technologies</p>
                    <p className="text-xs text-muted-foreground">Enterprise IT Solutions</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We deliver mission-critical IT infrastructure, AI automation, cybersecurity, and digital transformation solutions across India.
                </p>
              </div>

              {/* CTA */}
              <div className="rounded-2xl border border-brand/20 bg-brand/5 p-5">
                <p className="text-sm font-semibold text-foreground mb-2">Need help with your IT infrastructure?</p>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Our team of certified engineers is ready to help you design and deploy enterprise-grade solutions.
                </p>
                <Link href="/contact"
                  className="block text-center px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-all">
                  Get Free Consultation
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
