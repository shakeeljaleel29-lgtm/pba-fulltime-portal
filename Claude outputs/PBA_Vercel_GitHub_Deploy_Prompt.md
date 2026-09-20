# PBA Full-Time Portal — Vercel + GitHub Deployment Setup
## AntiGravity Prompt

---

```
Prepare the PBA Full-Time Portal for deployment to Vercel via GitHub.
Add the necessary config files and verify build settings.
Do NOT change any existing component or page.

════════════════════════════════════════════════════════════════
STEP 1 — CREATE vercel.json (root of project)
════════════════════════════════════════════════════════════════

Create a file called vercel.json in the project root with this content:

  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }

This ensures that refreshing any page in the React app does NOT
return a 404 on Vercel. Without this, any page except "/" will
break on a hard refresh.

════════════════════════════════════════════════════════════════
STEP 2 — VERIFY package.json build script
════════════════════════════════════════════════════════════════

Confirm that package.json has these scripts (add or correct if missing):

  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }

Do NOT change anything else in package.json.

════════════════════════════════════════════════════════════════
STEP 3 — CREATE .gitignore (if not already present)
════════════════════════════════════════════════════════════════

Create a .gitignore file in the project root (only if one doesn't
already exist) with this content:

  # Dependencies
  node_modules/

  # Build output
  dist/

  # Local env files
  .env
  .env.local
  .env.*.local

  # Editor
  .vscode/
  .idea/
  *.suo
  *.ntvs*
  *.njsproj
  *.sln
  *.sw?

  # OS
  .DS_Store
  Thumbs.db

  # Vite
  vite.config.js.timestamp-*

════════════════════════════════════════════════════════════════
STEP 4 — RUN BUILD TO VERIFY
════════════════════════════════════════════════════════════════

Run: npm run build
Confirm 0 errors.
Report: "Ready for GitHub + Vercel deployment. Files added: vercel.json, .gitignore"

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any existing component, page, or logic
2. Only ADD the three config files listed above
3. vercel.json is the most critical file — without it the app breaks on refresh
4. Run npm run build and confirm 0 errors
5. List all files added
```

---

## After AntiGravity runs this prompt — follow these steps:

### A. Push to GitHub

1. In AntiGravity, look for **"Export"** or **"Publish to GitHub"** button
2. Connect your GitHub account if prompted
3. Create a **new repository** named: `pba-fulltime-portal`
4. Set it to **Private**
5. Push the project — AntiGravity will upload all files including the new `vercel.json`

### B. Create a new Vercel account

1. Go to **vercel.com**
2. Click **"Sign Up"**
3. Use a **different email** from your existing Vercel account
   (e.g. a Gmail you haven't used on Vercel before)
4. Choose **"Continue with GitHub"** and connect the GitHub account
   that has the `pba-fulltime-portal` repo

### C. Deploy on Vercel

1. In your new Vercel dashboard, click **"Add New → Project"**
2. Find and select **`pba-fulltime-portal`** from the GitHub list
3. Vercel will auto-detect Vite. Confirm these settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **"Deploy"**
5. Wait ~60 seconds — Vercel will give you a live URL like:
   `pba-fulltime-portal.vercel.app`

### D. Auto-deploy on every update

From this point forward:
- Every time AntiGravity exports/pushes to GitHub → Vercel auto-deploys within ~60 seconds
- No manual steps needed — same workflow as HELIX and the fitness app
