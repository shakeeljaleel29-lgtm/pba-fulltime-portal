#!/bin/bash
git add .
git commit -m "Update: $(date '+%Y-%m-%d %H:%M')"
git push origin main
echo "✅ Pushed to GitHub — Vercel will deploy in ~60 seconds"
