// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/sections/LiveProjectsSection.tsx
//
// SERVER COMPONENT — replaces the static "Featured Work" section.
// Fetches projects with showOnWebsite: true from the backend.
// If the backend is unavailable, falls back gracefully (returns null).
//
// Usage: <LiveProjectsSection />
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import Image from 'next/image';
import { getShowcaseProjects } from '@/lib/cms';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function LiveProjectsSection() {
  const projects = await getShowcaseProjects(6);

  // If no projects are marked showOnWebsite, don't render the section
  if (projects.length === 0) return null;

  return (
    <section className="bg-transparent w-full py-20 sm:py-32">
      <div className="container px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Featured Work
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Explore our portfolio of successfully delivered projects.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/projects">
              View All Projects <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.slice(0, 3).map(project => (
            <div key={project._id} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-3xl aspect-[4/3] mb-6 bg-muted">
                {project.imageUrl ? (
                  <Image
                    src={project.imageUrl}
                    alt={project.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    data-ai-hint={project.imageHint}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand/10 to-indigo-500/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-brand/20">
                      {project.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:opacity-0" />
              </div>
              <h3 className="font-headline text-2xl font-bold mb-2 group-hover:text-brand transition-colors">
                {project.name}
              </h3>
              {project.shortDescription && (
                <p className="text-foreground/90 mb-4 font-medium">{project.shortDescription}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {project.tags?.slice(0, 3).map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs px-3 py-1"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
