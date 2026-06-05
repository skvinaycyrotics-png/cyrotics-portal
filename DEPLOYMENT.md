# CYROTICS — COMPLETE SETUP & DEPLOYMENT GUIDE

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CYROTICS PLATFORM                            │
├────────────────┬──────────────────┬────────────────────────────┤
│  Main Website  │  Portal (Admin / │  Backend API               │
│  cyrotics.in   │  Client)         │  api.cyrotics.in           │
│  Next.js       │  Next.js         │  Node.js + Express         │
│  Vercel        │  Vercel          │  Render / Railway          │
│  (output:      │  (server-side)   │                            │
│   export)      │                  │                            │
└────────────────┴──────────────────┴────────────────────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │ MongoDB Atlas│
                                    │  Free Tier   │
                                    └─────────────┘
```

---

## STEP 1 — MongoDB Atlas Setup (Free Tier)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a new project: **Cyrotics**
3. Build a Database → **M0 Free** tier → Region: **Mumbai (ap-south-1)**
4. Create a database user:
   - Username: `cyrotics_admin`
   - Password: Generate a strong password and save it
5. Network Access → Add IP Address → **Allow Access from Anywhere** (0.0.0.0/0)
   - This is required for Render/Railway deployment
6. Connect → Drivers → Copy the connection string
   - It looks like: `mongodb+srv://cyrotics_admin:<password>@cluster0.xxxxx.mongodb.net/`
   - Replace `<password>` with your actual password
   - Add `/cyrotics` before the `?` to set the database name:
   - Final: `mongodb+srv://cyrotics_admin:PASSWORD@cluster0.xxxxx.mongodb.net/cyrotics?retryWrites=true&w=majority`

---

## STEP 2 — Gmail App Password Setup

1. Go to your Google Account → Security
2. Enable 2-Step Verification (required)
3. Search for "App passwords"
4. App → Mail, Device → Other → Name it "Cyrotics Backend"
5. Copy the 16-character app password (no spaces)
6. This goes in `SMTP_PASS` in your backend environment variables

---

## STEP 3 — Deploy the Backend to Render

### 3a. Push backend to its own GitHub repo
```bash
# Create a new repo on GitHub called: cyrotics-backend
cd cyrotics-backend
git init
git add .
git commit -m "initial: cyrotics backend api"
git remote add origin https://github.com/YOUR_USERNAME/cyrotics-backend.git
git push -u origin main
```

### 3b. Create Render Web Service
1. Go to https://render.com and sign up
2. New → Web Service → Connect your GitHub repo
3. Settings:
   - **Name**: cyrotics-backend
   - **Region**: Singapore (closest to India)
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3c. Add Environment Variables in Render Dashboard
Add each of these in Render → Environment:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=<your atlas connection string>
JWT_ACCESS_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<generate another one>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tecsupp.cyrotics@gmail.com
SMTP_PASS=<your gmail app password>
EMAIL_FROM=Cyrotics Technologies <tecsupp.cyrotics@gmail.com>
ADMIN_EMAIL=tecsupp.cyrotics@gmail.com
FRONTEND_URL=https://www.cyrotics.in
COOKIE_SECRET=<generate another random hex>
ADMIN_NAME=Vinay Kumar Sharma
ADMIN_EMAIL_SEED=admin@cyrotics.in
ADMIN_PASSWORD=<a strong password min 12 chars>
```

### 3d. Run the seed script (one time)
After first deployment, open Render → Shell:
```bash
node scripts/seed.js
```
This creates the admin account. Save the credentials.

### 3e. Note your backend URL
Render gives you: `https://cyrotics-backend.onrender.com`
Custom domain: Set `api.cyrotics.in` → CNAME to `cyrotics-backend.onrender.com`

---

## STEP 4 — Deploy the Portal to Vercel

### 4a. Push portal to GitHub
```bash
# Create a new repo called: cyrotics-portal
cd cyrotics-portal
git init
git add .
git commit -m "initial: cyrotics admin + client portal"
git remote add origin https://github.com/YOUR_USERNAME/cyrotics-portal.git
git push -u origin main
```

### 4b. Create Vercel project
1. Go to https://vercel.com
2. New Project → Import from GitHub → cyrotics-portal
3. Framework Preset: **Next.js**
4. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://cyrotics-backend.onrender.com/api
   ```
5. Deploy

### 4c. Set custom domain
In Vercel → Domains → Add: `portal.cyrotics.in`
Add a CNAME record in your DNS: `portal → cname.vercel-dns.com`

---

## STEP 5 — Connect the Main Website to the Backend

In your main `cyrotics-in` frontend (cyrotics.in), update the contact form to call the real API.

In `src/app/contact/contact-forms.tsx`, replace the mock function:

```typescript
// Replace the mock submitContactForm with this real one:
async function submitContactForm(prevState: ContactFormState, formData: FormData): Promise<ContactFormState> {
  try {
    const body = Object.fromEntries(formData.entries());
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return { type: 'success', message: 'Your inquiry has been submitted successfully. We will respond within 1–2 business days.', errors: {}, mailto: null };
  } catch (err) {
    return { type: 'error', message: err instanceof Error ? err.message : 'Submission failed.', errors: {}, mailto: null };
  }
}
```

Add to your main website's Vercel environment variables:
```
NEXT_PUBLIC_API_URL=https://cyrotics-backend.onrender.com/api
```

---

## STEP 6 — API Reference

All requests go to: `https://cyrotics-backend.onrender.com/api`

### Public Endpoints (no auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/contact` | Submit contact form |
| POST | `/register` | Request portal access |
| GET | `/cms/testimonials?published=true` | Get published testimonials |
| GET | `/cms/jobs?published=true` | Get published jobs |
| GET | `/cms/blogs?published=true` | Get published blogs |
| GET | `/cms/blogs/:slug` | Get single blog post |
| GET | `/cms/social-links` | Get social media links |

### Auth Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login (returns cookies) |
| POST | `/auth/logout` | Logout (clears cookies) |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/change-password` | Change password |
| POST | `/auth/2fa/setup` | Generate 2FA QR code |
| POST | `/auth/2fa/verify` | Enable 2FA |

### Admin Endpoints (admin role required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | Dashboard KPIs + recent data |
| GET | `/admin/users` | List all users |
| PUT | `/admin/users/:id/approve` | Approve user |
| PUT | `/admin/users/:id/reject` | Reject user |
| PUT | `/admin/users/:id/suspend` | Suspend user |
| PUT | `/admin/users/:id/dashboard-config` | Customize client dashboard |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/admin/registrations` | List access requests |
| PUT | `/admin/registrations/:id/approve` | Approve + create account |
| PUT | `/admin/registrations/:id/reject` | Reject request |
| GET | `/admin/contacts` | List contact submissions |
| GET | `/admin/audit-logs` | Security audit logs |

### Project Endpoints (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects` | List projects (filtered by role) |
| GET | `/projects/:id` | Get project details |
| POST | `/projects` | Create project (admin) |
| PUT | `/projects/:id` | Update project (admin) |
| POST | `/projects/:id/comments` | Add comment |

### Ticket Endpoints (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tickets` | List tickets (filtered by role) |
| GET | `/tickets/:id` | Get ticket with responses |
| POST | `/tickets` | Create ticket |
| POST | `/tickets/:id/responses` | Add response |
| PUT | `/tickets/:id` | Update ticket (admin) |

### CMS Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/cms/testimonials` | List testimonials |
| POST | `/cms/testimonials` | Create (admin) |
| PUT | `/cms/testimonials/:id` | Update (admin) |
| DELETE | `/cms/testimonials/:id` | Delete (admin) |
| GET/POST/PUT/DELETE | `/cms/blogs/:id` | Blog CRUD |
| GET/POST/PUT/DELETE | `/cms/jobs/:id` | Job CRUD |
| GET | `/cms/social-links` | Get links |
| PUT | `/cms/social-links` | Update all links (admin) |

---

## STEP 7 — Portal URLs

After deployment:

| Portal | URL | Access |
|--------|-----|--------|
| Admin Portal | `https://portal.cyrotics.in/admin/dashboard` | Admin only |
| Client Portal | `https://portal.cyrotics.in/portal/dashboard` | Clients + Guests |
| Registration | `https://portal.cyrotics.in/register` | Public |
| Login | `https://portal.cyrotics.in/login` | All users |

---

## STEP 8 — What's remaining (extend yourself)

These pages follow the same patterns shown in the code:

**Admin pages** (create in `src/app/admin/`):
- `projects/page.tsx` — list + create projects, assign to clients
- `tickets/page.tsx` — list + manage tickets, assign to team
- `contacts/page.tsx` — view + update contact status
- `registrations/page.tsx` — approve/reject access requests
- `cms/testimonials/page.tsx` — CRUD testimonials
- `cms/blogs/page.tsx` — CRUD blog posts
- `cms/jobs/page.tsx` — CRUD job listings
- `cms/social/page.tsx` — update social links
- `audit-logs/page.tsx` — paginated audit log viewer

**Client portal pages**:
- `portal/projects/page.tsx` — list view
- `portal/projects/[id]/page.tsx` — detail with milestones + documents
- `portal/tickets/page.tsx` — list view
- `portal/tickets/[id]/page.tsx` — detail with response thread

All follow the exact pattern of the dashboard and users pages already built.

---

## Security Checklist

- [x] JWT access tokens (15min) + refresh tokens (7 days)
- [x] Tokens stored in httpOnly cookies (XSS-safe)
- [x] bcrypt password hashing (cost factor 12)
- [x] Account lockout after 5 failed login attempts
- [x] Rate limiting (100 req/15min global, 10 login/15min)
- [x] Helmet security headers
- [x] CORS restricted to cyrotics.in origin
- [x] MongoDB sanitization (NoSQL injection prevention)
- [x] XSS-clean middleware
- [x] HPP (HTTP Parameter Pollution) protection
- [x] Input validation with express-validator
- [x] RBAC (admin/client/guest roles)
- [x] Audit log for all sensitive actions
- [x] 2FA support (TOTP)
- [x] Security headers via vercel.json
- [x] TypeScript ignoreBuildErrors: false

---

## File Structure

```
cyrotics-backend/               ← Deploy to Render
├── src/
│   ├── server.js               ← Main Express app
│   ├── config/db.js            ← MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Ticket.js
│   │   └── index.js            ← All other models
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── cmsController.js
│   │   └── dataController.js
│   ├── middleware/auth.js
│   ├── routes/index.js
│   ├── services/
│   │   ├── emailService.js
│   │   └── authService.js
│   └── utils/
│       ├── logger.js
│       └── response.js
├── scripts/seed.js
├── .env.example
├── render.yaml
└── package.json

cyrotics-portal/                ← Deploy to Vercel (portal.cyrotics.in)
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx      ← Admin sidebar + auth guard
│   │   │   ├── dashboard/
│   │   │   └── users/
│   │   └── portal/
│   │       ├── layout.tsx      ← Client sidebar + custom theme
│   │       ├── dashboard/
│   │       ├── tickets/new/
│   │       └── profile/
│   ├── hooks/useAuth.tsx
│   └── lib/api.ts
├── .env.example
└── next.config.js

cyrotics-in/                    ← Your existing website (cyrotics.in)
├── Fix package from previous delivery applied
└── contact form updated to call real API
```
