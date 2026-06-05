# CYROTICS — FINAL PACKAGE README

This package completes all 6 pending items. Here is exactly what to do with each file.

---

## FILES IN THIS PACKAGE

```
src/
├── app/
│   ├── page.tsx                              ← REPLACE in cyrotics.in repo
│   ├── sitemap.ts                            ← NEW in cyrotics.in repo
│   ├── blog/
│   │   ├── page.tsx                          ← NEW in cyrotics.in repo
│   │   └── [slug]/page.tsx                   ← NEW in cyrotics.in repo
│   ├── careers/
│   │   ├── page.tsx                          ← NEW in cyrotics.in repo
│   │   └── [slug]/page.tsx                   ← NEW in cyrotics.in repo
│   ├── admin/
│   │   ├── projects/page.tsx                 ← NEW in cyrotics-portal repo
│   │   ├── tickets/page.tsx                  ← NEW in cyrotics-portal repo
│   │   └── cms/blogs/page.tsx                ← NEW in cyrotics-portal repo
│   └── portal/
│       ├── projects/[id]/page.tsx            ← NEW in cyrotics-portal repo
│       └── tickets/[id]/page.tsx             ← NEW in cyrotics-portal repo
├── components/
│   └── sections/
│       ├── TestimonialsSection.tsx           ← NEW in cyrotics.in repo
│       └── LiveProjectsSection.tsx           ← NEW in cyrotics.in repo
└── lib/
    └── cms.ts                                ← NEW in cyrotics.in repo

next.config.ts                                ← REPLACE in cyrotics.in repo
```

---

## STEP-BY-STEP INTEGRATION

### 1. Main Website (cyrotics.in repo)

#### 1a. Add the CMS library
Copy `src/lib/cms.ts` into your website repo at `src/lib/cms.ts`.
Then add to your `.env` / Vercel env vars:
```
NEXT_PUBLIC_API_URL=https://cyrotics-backend.onrender.com/api
```

#### 1b. Replace next.config.ts
Copy `next.config.ts` — this REMOVES `output: 'export'`.

**Why this matters:** Without this change, the blog/careers/testimonials data
will be frozen at build time and never update. With ISR (the default mode),
Vercel automatically refreshes pages in the background on a schedule.

**Vercel action required:** Go to your Vercel project → Settings → make sure
Framework Preset is "Next.js" (not "Static Site"). This is usually already correct.

#### 1c. Add new sections to the homepage
Copy both component files:
- `src/components/sections/TestimonialsSection.tsx`
- `src/components/sections/LiveProjectsSection.tsx`

Then replace `src/app/page.tsx` with the new version.

> NOTE: The `home-client.tsx` file from the previous package does NOT change.
> The new `page.tsx` just imports it + the two new server sections.

#### 1d. Add blog pages
Copy:
- `src/app/blog/page.tsx`
- `src/app/blog/[slug]/page.tsx`

#### 1e. Add careers pages
Copy:
- `src/app/careers/page.tsx`
- `src/app/careers/[slug]/page.tsx`

#### 1f. Add sitemap
Copy `src/app/sitemap.ts` — this replaces any static sitemap.xml you have.
Next.js will serve it automatically at `/sitemap.xml`.

#### 1g. Add navigation links
In your site header/footer, add links to:
- `/blog` — "Blog" or "Insights"
- `/careers` — "Careers"

---

### 2. Portal (cyrotics-portal repo)

#### 2a. Admin: Projects management
Copy `src/app/admin/projects/page.tsx`
→ Full project CRUD, client assignment, milestones, progress slider, showcase toggle

#### 2b. Admin: Tickets management
Copy `src/app/admin/tickets/page.tsx`
→ Split-pane layout: ticket list + conversation thread with internal notes

#### 2c. Admin: Blog CMS
Copy `src/app/admin/cms/blogs/page.tsx`
→ Markdown editor with toolbar, live preview, SEO tab with checklist

#### 2d. Client: Project detail
Copy `src/app/portal/projects/[id]/page.tsx`
→ Tabbed view: overview, milestones timeline, documents download, comment thread

#### 2e. Client: Ticket detail
Copy `src/app/portal/tickets/[id]/page.tsx`
→ Full conversation thread, reply box, rating system after resolution

---

## FEATURE SUMMARY

### What is now live-editable from Admin Panel

| Feature | Where in Admin | Where it appears |
|---------|---------------|-----------------|
| Testimonials | Admin → CMS → Testimonials | cyrotics.in homepage |
| Blog posts | Admin → CMS → Blogs | cyrotics.in/blog/* |
| Job listings | Admin → CMS → Jobs | cyrotics.in/careers/* |
| Social links | Admin → CMS → Social Links | Website footer |
| Projects (showcase) | Admin → Projects → toggle showOnWebsite | cyrotics.in homepage |
| Contact requests | Admin → Contact Requests | Viewed + managed in admin |

### What clients can now do

| Feature | Portal page |
|---------|------------|
| View projects | /portal/projects |
| Track milestones | /portal/projects/:id → Milestones tab |
| Download documents | /portal/projects/:id → Documents tab |
| Comment on projects | /portal/projects/:id → Comments tab |
| Raise tickets | /portal/tickets/new |
| View ticket thread | /portal/tickets/:id |
| Reply to tickets | /portal/tickets/:id |
| Rate resolved tickets | /portal/tickets/:id (after resolution) |

---

## COMPLETE PLATFORM OVERVIEW

```
cyrotics.in                 ← Main website (static pages + ISR CMS pages)
  /blog                     ← Live blog from DB
  /careers                  ← Live jobs from DB
  /sitemap.xml              ← Auto-generated with all pages + posts + jobs

portal.cyrotics.in          ← Admin + Client portal
  /login                    ← Unified login
  /register                 ← Public access request
  /admin/dashboard          ← KPIs + charts
  /admin/users              ← Approve/reject/suspend users
  /admin/registrations      ← Review access requests
  /admin/projects           ← Create + manage projects
  /admin/tickets            ← Ticket management with reply thread
  /admin/contacts           ← Contact form submissions
  /admin/cms/testimonials   ← Manage testimonials
  /admin/cms/blogs          ← Write + publish blog posts
  /admin/cms/jobs           ← Post job listings
  /admin/cms/social         ← Social media links
  /admin/audit-logs         ← Security events
  /portal/dashboard         ← Client overview
  /portal/projects          ← Client project list
  /portal/projects/:id      ← Milestones + documents + comments
  /portal/tickets           ← Client ticket list
  /portal/tickets/new       ← Raise new ticket
  /portal/tickets/:id       ← Conversation thread + rating
  /portal/profile           ← Update profile + 2FA

api.cyrotics.in             ← Backend API (Render)
MongoDB Atlas               ← Database (Free M0 cluster)
```

---

## ISR Revalidation Schedule

| Page | Revalidates every |
|------|------------------|
| Homepage | 1 hour |
| Blog listing | 15 minutes |
| Blog post | 1 hour |
| Careers | 30 minutes |
| Job detail | 1 hour |
| Sitemap | 1 hour |

This means: when you publish a new blog post in the admin panel, it will
appear on cyrotics.in/blog within 15 minutes — without any deployment.
