# Deploy Wavloops landing — GitHub + Vercel

Step-by-step guide. Run from inside the `Wavloopsapp/` directory.

---

## 1. Local env vars (run before first deploy)

Copy the example file and fill in real values:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

- **Supabase** → Dashboard → Settings → API
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- **Resend** → Dashboard → API Keys
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL` (use `onboarding@resend.dev` for testing without a verified domain)
  - `ADMIN_EMAIL` (your inbox — gets a notification on every submission)

Restart `npm run dev` after editing.

---

## 2. Verify everything works locally

```bash
npm run dev
```

Open `http://localhost:3000/onboarding_early`, complete the flow, then check:
- Row appears in Supabase → Table Editor → `onboarding_early`
- Confirmation email arrives at the test user address
- Admin notification arrives at `ADMIN_EMAIL`

If anything fails, check the dev server console for errors.

---

## 3. Initial commit + GitHub

The repo is already initialized as `main`. Stage and commit everything:

```bash
git add .
git commit -m "Initial landing + onboarding + Supabase + Resend"
```

Then create a new GitHub repo at https://github.com/new
- Name: `wavloops-landing` (or whatever)
- **Do NOT** initialize with README / .gitignore / license (we already have files)
- Create

Connect and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/wavloops-landing.git
git push -u origin main
```

---

## 4. Deploy to Vercel

1. Go to https://vercel.com/new
2. Click **Import** next to your GitHub repo
3. **Framework preset**: Next.js (auto-detected)
4. **Root directory**: leave default
5. **BEFORE clicking Deploy**, expand the **Environment Variables** section and add all 5 vars from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `ADMIN_EMAIL`
6. Click **Deploy**

First build takes ~1-2 minutes. After success you get a `your-project.vercel.app` URL.

---

## 5. Custom domain (optional but recommended)

Vercel dashboard → your project → **Settings** → **Domains**
- Add your domain (e.g., `wavloops.app`)
- Vercel will show you the DNS records to set up at your registrar (Namecheap / Gandi / OVH / etc.)
- Records propagate within minutes to a few hours

Once DNS is configured, your landing is live on the real domain. SSL is automatic.

---

## 6. Test in production

Open your production URL:
- Complete onboarding
- Verify row in Supabase
- Verify both emails arrive

---

## Updating after first deploy

Any `git push` to `main` triggers an automatic Vercel build + deploy. No manual steps needed.

```bash
git add .
git commit -m "Your changes"
git push
```

---

## Notes & gotchas

- **iCloud Drive**: this project lives in iCloud. Git operations work but can be slow if iCloud is syncing. If a `git push` hangs, wait for iCloud sync to complete or pause sync temporarily.
- **Resend domain verification**: `onboarding@resend.dev` only delivers to your own verified inbox. Once you verify a real domain in Resend, switch `RESEND_FROM_EMAIL` to use it (e.g., `Wavloops <hello@wavloops.app>`) so emails reach all producers, not just you.
- **Service role key**: never commit it, never expose it client-side. It bypasses RLS. The `.gitignore` already protects `.env.local`.
- **Supabase free tier**: 500 MB DB + 50k monthly active users is plenty for the concierge MVP phase.
- **Vercel free tier (Hobby)**: 100 GB bandwidth/month, unlimited serverless invocations. Plenty for testing. Switch to Pro only if traffic explodes.
