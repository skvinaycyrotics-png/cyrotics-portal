// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/sections/TestimonialsSection.tsx
//
// DROP-IN REPLACEMENT for any static testimonials section.
// This is a SERVER COMPONENT — no 'use client' needed.
// Data is fetched at render time (ISR, revalidates every hour).
//
// Usage in any page:
//   import TestimonialsSection from '@/components/sections/TestimonialsSection';
//   <TestimonialsSection />
// ─────────────────────────────────────────────────────────────────────────────

import { getTestimonials, Testimonial } from '@/lib/cms';
import { Star } from 'lucide-react';

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="rounded-3xl border bg-background p-6 shadow-sm flex flex-col gap-4">
      {/* Stars */}
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20'}`} />
        ))}
      </div>

      {/* Quote */}
      <p className="text-foreground/80 text-sm leading-relaxed flex-1">
        &ldquo;{t.message}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/50">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {t.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
          {(t.designation || t.company) && (
            <p className="text-xs text-muted-foreground truncate">
              {t.designation}{t.designation && t.company ? ', ' : ''}{t.company}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function TestimonialsSection() {
  const testimonials = await getTestimonials();

  if (testimonials.length === 0) return null;

  return (
    <section className="bg-transparent w-full py-20 sm:py-32">
      <div className="container px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            What Our Clients Say
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-lg text-foreground/70">
            Trusted by enterprises and government organizations across India.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map(t => <TestimonialCard key={t._id} t={t} />)}
        </div>
      </div>
    </section>
  );
}
