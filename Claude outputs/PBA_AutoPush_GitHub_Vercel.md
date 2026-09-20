# PBA Full-Time Portal — Auto Push to GitHub & Vercel
## AntiGravity Prompt — Run Once to Set Up

---

```
Set up automatic git push to GitHub after every code change,
so Vercel auto-deploys immediately whenever the app is updated.

════════════════════════════════════════════════════════════════
STEP 1 — VERIFY GIT REMOTE IS CORRECT
════════════════════════════════════════════════════════════════

Run:
  git remote -v

If the remote is not set or is wrong, run:
  git remote remove origin
  git remote add origin https://YOURTOKEN@github.com/shakeeljaleel29-lgtm/pba-fulltime-portal.git

Replace YOURTOKEN with your GitHub personal access token (starts with ghp_).

════════════════════════════════════════════════════════════════
STEP 2 — CREATE AUTO-PUSH SCRIPT
════════════════════════════════════════════════════════════════

Create a file called push.sh in the project root:

  #!/bin/bash
  git add .
  git commit -m "Update: $(date '+%Y-%m-%d %H:%M')"
  git push origin main
  echo "✅ Pushed to GitHub — Vercel will deploy in ~60 seconds"

Make it executable:
  chmod +x push.sh

════════════════════════════════════════════════════════════════
STEP 3 — ADD NPM DEPLOY SCRIPT TO package.json
════════════════════════════════════════════════════════════════

In package.json, add a "deploy" script alongside the existing ones:

  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "git add . && git commit -m \"Update: $(date '+%Y-%m-%d %H:%M')\" && git push origin main"
  }

After this is set up, running:
  npm run deploy

...will commit all changes and push to GitHub in one command,
triggering Vercel to auto-deploy within 60 seconds.

════════════════════════════════════════════════════════════════
STEP 4 — TEST THE AUTO-PUSH
════════════════════════════════════════════════════════════════

Run:
  npm run deploy

Confirm output shows:
  - "1 file changed" or similar git commit message
  - "Branch 'main' set up to track remote branch 'main'"
  - No errors

After this, every future prompt/change in AntiGravity should
end with: npm run deploy

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any component or page logic
2. Only add push.sh and update package.json scripts
3. The GitHub token in the remote URL must have 'repo' scope
4. Vercel will auto-deploy within 60 seconds of every push
5. Run npm run build first to confirm 0 errors, then npm run deploy
6. Confirm "Push successful" when done
```

---

## After this is set up:

Every future AntiGravity prompt should end with these two lines:

```
Run npm run build to confirm 0 errors.
Then run npm run deploy to push to GitHub and trigger Vercel deployment.
```

This means every single change you make goes live on
pba-fulltime-portal.vercel.app within 60 seconds automatically.
