// FILE: src/app/careers/[slug]/page.tsx

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getJob, getJobs } from '@/lib/cms';
import { MapPin, Clock, ArrowLeft, CheckCircle2, ArrowRight, GraduationCap, IndianRupee, Building2 } from 'lucide-react';

export const revalidate = 3600;

export async function generateStaticParams() {
  const jobs = await getJobs();
  return jobs.map(j => ({ slug: j.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const job = await getJob(params.slug);
  if (!job) return { title: 'Job not found' };
  const url = `https://www.cyrotics.in/careers/${job.slug}/`;
  return {
    title: `${job.title} — Careers at Cyrotics`,
    description: `${job.title} at Cyrotics Technologies. ${job.location ? `Location: ${job.location}.` : ''} ${job.experience ? `Experience: ${job.experience}.` : ''} Apply now.`,
    alternates: { canonical: url },
    openGraph: { url, title: `${job.title} | Cyrotics Careers` },
  };
}

const TYPE_LABEL: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time',
  contract: 'Contract', internship: 'Internship',
};

export default async function JobDetailPage({ params }: { params: { slug: string } }) {
  const job = await getJob(params.slug);
  if (!job) notFound();

  const applyUrl = `/contact?subject=Job Application: ${encodeURIComponent(job.title)}`;

  const jobSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.createdAt,
    validThrough: job.closingDate,
    employmentType: job.type.toUpperCase().replace('_', ''),
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Cyrotics Technologies (OPC) Pvt. Ltd.',
      sameAs: 'https://www.cyrotics.in',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'New Delhi',
        addressCountry: 'IN',
      },
    },
  };

  return (
    <main className="w-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }} />

      <section className="py-16 border-b border-border/50">
        <div className="container px-4 sm:px-6 max-w-4xl">
          <Link href="/careers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to careers
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex-1">
              {job.department && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand/10 text-brand mb-3 inline-block">{job.department}</span>
              )}
              <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight mb-4">{job.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {job.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span>}
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{TYPE_LABEL[job.type] || job.type}</span>
                {job.experience && <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{job.experience}</span>}
                {job.salary && <span className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4" />{job.salary}</span>}
              </div>
            </div>
            <Link href={applyUrl}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold hover:opacity-90 transition-all shadow-lg shrink-0">
              Apply Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container px-4 sm:px-6 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
            <div className="space-y-10">
              {/* Description */}
              <div>
                <h2 className="font-headline text-xl font-bold mb-4">About the Role</h2>
                <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{job.description}</div>
              </div>

              {/* Responsibilities */}
              {job.responsibilities?.length > 0 && (
                <div>
                  <h2 className="font-headline text-xl font-bold mb-4">Responsibilities</h2>
                  <ul className="space-y-2">
                    {job.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                        <CheckCircle2 className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {job.requirements?.length > 0 && (
                <div>
                  <h2 className="font-headline text-xl font-bold mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((r, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand mt-2 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply CTA */}
              <div className="rounded-3xl border border-brand/20 bg-brand/5 p-8 text-center">
                <h3 className="font-headline text-xl font-bold mb-2">Ready to Apply?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Send your updated resume and a brief cover letter via our contact form. We respond to all applications within 5 business days.
                </p>
                <Link href={applyUrl}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand/90 transition-all">
                  Apply for This Role <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Job Details</h3>
                {[
                  { icon: Building2, label: 'Department', value: job.department || 'Engineering' },
                  { icon: MapPin, label: 'Location', value: job.location || 'New Delhi' },
                  { icon: Clock, label: 'Type', value: TYPE_LABEL[job.type] || job.type },
                  { icon: GraduationCap, label: 'Experience', value: job.experience || 'As per role' },
                  ...(job.salary ? [{ icon: IndianRupee, label: 'Salary', value: job.salary }] : []),
                  ...(job.closingDate ? [{ icon: Clock, label: 'Closes', value: new Date(job.closingDate).toLocaleDateString('en-IN') }] : []),
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-2">About Cyrotics</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cyrotics Technologies (OPC) Pvt. Ltd. is a New Delhi-based enterprise IT systems integrator. We design and deploy data centers, networking, cybersecurity, AV, and smart infrastructure solutions across India.
                </p>
                <Link href="/contact" className="block mt-4 text-center px-4 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-all">
                  Contact Us
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
