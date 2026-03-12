# Deploy: GitHub → Netlify + Supabase

## 1. Push to GitHub

**Create the repo on GitHub first:**
- Go to [github.com/new](https://github.com/new)
- Repository name: e.g. `it-support-dashboard`
- Public, no README (we already have one)
- Create repository

**Then in your project folder run** (replace `YOUR_USERNAME` and `YOUR_REPO`):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

If you use SSH:
```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 2. Supabase

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name, database password, region → Create
3. In the project: **SQL Editor** → **New query** → paste the full content of **`database/schema.sql`** → **Run**
4. **Settings** (gear) → **API**: copy
   - **Project URL**
   - **anon public** key (under "Project API keys")

---

## 3. Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. **Connect to Git provider** → **GitHub** → authorize → choose **your repo**
3. Build settings (usually auto-filled):
   - **Build command:** `npm run build`
   - **Publish directory:** `.next` (or leave default if using Next.js plugin)
   - **Node version:** 18 (in Environment variables: `NODE_VERSION` = `18` if needed)
4. **Site settings** → **Environment variables** → **Add** (or **Add variable** → **Add single variable**):
   - Key: `NEXT_PUBLIC_SUPABASE_URL`  
     Value: your Supabase **Project URL**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
     Value: your Supabase **anon public** key
5. **Deploys** → **Trigger deploy** → **Deploy site** (or push to `main` to auto-deploy)

Your site will be at `https://your-site-name.netlify.app`.

---

## 4. Optional: Netlify plugin

If Netlify offers the **Essential Next.js** plugin during import, enable it. It sets the correct build and publish settings for Next.js.

---

## Summary

| Step | Where | What |
|------|--------|------|
| 1 | GitHub | Create repo, then `git remote add origin ...` and `git push -u origin main` |
| 2 | Supabase | New project → run `database/schema.sql` → copy URL + anon key |
| 3 | Netlify | Import repo → add env vars (Supabase URL + anon key) → deploy |
