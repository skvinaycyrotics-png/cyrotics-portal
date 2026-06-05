// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/app/careers/page.tsx  — cyrotics.in/careers
// SERVER COMPONENT with ISR. Fetches live job listings from the backend.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import Link from 'next/link';
import { getJobs } from '@/lib/cms';
import { Briefcase, MapPin, Clock, ArrowRight, Users, GraduationCap, Zap, IndianRupee } from 'lucide-react';

export const revalidate = 1800; // 30 min

export const metadata: Metadata = {
  title: 'Careers — Join the Cyrotics Team',
  description: 'Explore career opportunities at Cyrotics Technologies. We are hiring engineers, cybersecurity specialists, cloud architects, and more. Join us to build the future of enterprise IT in India.',
  alternates: { canonical: 'https://www.cyrotics.in/careers/' },
  openGraph: { url: 'https://www.cyrotics.in/careers/', title: 'Careers | Cyrotics Technologies' },
};

const TYPE_LABEL: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time',
  contract: 'Contract', internship: 'Internship',
};

const PERKS = [
  { icon: Zap, title: 'Cutting-edge Tech', desc: 'Work with the latest enterprise technologies — Cisco, Fortinet, VMware, AWS, and more.' },
  { icon: GraduationCap, title: 'Learning & Certs', desc: 'Company-sponsored certifications: CCNA, CISSP, AWS, Azure, and industry-specific qualifications.' },
  { icon: Users, title: 'Collaborative Culture', desc: 'Small teams, big impact. Every engineer ships real solutions to real enterprise clients.' },
  { icon: MapPin, title: 'Pan-India Projects', desc: 'Travel across India delivering mission-critical infrastructure for government, aviation, and enterprise.' },
];

export default async function CareersPage() {
  const jobs = await getJobs();

  const departments = Array.from(new Set(jobs.map(j => j.department).filter((d): d is string => Boolean(d))));

  const jobsByDept = departments.length
    ? departments.reduce((acc, dept) => {
        acc[dept] = jobs.filter(j => j.department === dept);
        return acc;
      }, {} as Record<string, typeof jobs>)
    : { 'Open Positions': jobs };

  return (
    <main className="w-full">
      {/* Hero */}
      <section className="py-24 text-center bg-primary/5 border-b border-border/50">
        <div className="container px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-medium mb-6">
            <Briefcase className="h-4 w-4" /> We&apos;re Hiring
          </div>
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5">
            Build the Future of<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Enterprise IT
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join a team of engineers delivering mission-critical infrastructure across India.
            We&apos;re looking for passionate technologists who thrive on solving complex problems.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#openings" className="px-8 py-3.5 rounded-full bg-brand text-white font-semibold hover:bg-brand/90 transition-all hover:scale-105 shadow-lg">
              View Openings
            </a>
            <Link href="/contact" className="px-8 py-3.5 rounded-full border-2 border-foreground/20 text-foreground font-semibold hover:bg-foreground/5 transition-all">
              Send Your Resume
            </Link>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-20">
        <div className="container px-4 sm:px-6">
          <h2 className="font-headline text-3xl font-bold text-center mb-12">Why Join Cyrotics?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PERKS.map(perk => (
              <div key={perk.title} className="rounded-3xl border bg-card p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10">
                  <perk.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-headline text-base font-bold mb-2">{perk.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job listings */}
      <section id="openings" className="py-20 bg-primary/5">
        <div className="container px-4 sm:px-6">
          <div className="mb-12">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold mb-3">Open Positions</h2>
            <p className="text-muted-foreground">
              {jobs.length} open role{jobs.length !== 1 ? 's' : ''} across our teams
            </p>
          </div>

          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground rounded-3xl border border-dashed border-border">
              <Briefcase className="h-14 w-14 mb-4 opacity-30" />
              <p className="text-xl font-medium mb-2">No openings right now</p>
              <p className="text-sm mb-6">We&apos;re always looking for great talent. Send your resume and we&apos;ll keep you in mind.</p>
              <Link href="/contact" className="px-6 py-2.5 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-all">
                Send Unsolicited Application
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(jobsByDept).map(([dept, deptJobs]) => (
                <div key={dept}>
                  <h3 className="font-headline text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand inline-block" />
                    {dept}
                  </h3>
                  <div className="space-y-3">
                    {deptJobs.map(job => (
                      <Link key={job._id} href={`/careers/${job.slug}`}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 hover:border-brand/30 hover:shadow-lg transition-all">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-headline text-base font-bold group-hover:text-brand transition-colors mb-1.5">
                            {job.title}
                          </h4>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {job.location && (
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />{TYPE_LABEL[job.type] || job.type}
                            </span>
                            {job.experience && (
                              <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{job.experience}</span>
                            )}
                            {job.salary && (
                              <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{job.salary}</span>
                            )}
                            {job.closingDate && new Date(job.closingDate) > new Date() && (
                              <span className="flex items-center gap-1 text-amber-500">
                                <Clock className="h-3 w-3" />
                                Closes {new Date(job.closingDate).toLocaleDateString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-sm text-brand font-medium shrink-0 group-hover:gap-2 transition-all">
                          Apply now <ArrowRight className="h-4 w-4" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20">
        <div className="container px-4 sm:px-6 text-center max-w-2xl mx-auto">
          <h2 className="font-headline text-3xl font-bold mb-4">Don&apos;t see a fit?</h2>
          <p className="text-muted-foreground mb-8">
            We&apos;re always looking for exceptional talent. Send us your resume and tell us how you&apos;d contribute to the Cyrotics mission.
          </p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20">
            Send Your Resume <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
