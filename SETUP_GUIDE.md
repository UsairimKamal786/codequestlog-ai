# CodeQuestLog AI — Vercel Setup 🎮👑

## Files
- `codequestlog-ai.html` → the AI chat page (link to THIS one)
- `index.html` → tiny redirect to codequestlog-ai.html
- `codequestlog-ai.css` → styling
- `codequestlog-ai.js` → frontend logic (no API key inside — safe)
- `api/chat.js` → Vercel Serverless Function, holds your Gemini key server-side
- `vercel.json` → basic config

---

## STEP 1 — Get your Gemini API key
1. Go to https://aistudio.google.com
2. Sign in → Get API Key → Create key
3. Copy it — keep it private, paste it only in Vercel later (Step 4)

---

## STEP 2 — Push to GitHub
1. Go to https://github.com → New repository → name it `codequestlog-ai`
2. Upload ALL files from this folder, keeping the `api` folder as a folder:
   ```
   codequestlog-ai/
   ├── codequestlog-ai.html
   ├── index.html
   ├── codequestlog-ai.css
   ├── codequestlog-ai.js
   ├── vercel.json
   └── api/
       └── chat.js
   ```
3. Commit the files

---

## STEP 3 — Deploy on Vercel
1. Go to https://vercel.com → sign up free with your GitHub account
2. Click **Add New...** → **Project**
3. Find and **Import** your `codequestlog-ai` repo
4. Framework Preset: **Other** (it should auto-detect, leave default settings)
5. Don't click Deploy yet — first do Step 4 below, OR deploy now and add the
   env variable afterward (you'll just need to redeploy once after adding it)

---

## STEP 4 — Add your Gemini key (the important part)
1. In your Vercel project → **Settings** tab → **Environment Variables**
2. Name: `GOOGLE_API_KEY`
3. Value: paste your Gemini key
4. Environment: select all (Production, Preview, Development)
5. Click **Save**
6. Go to **Deployments** tab → click the **...** menu on the latest deployment → **Redeploy**

---

## STEP 5 — Visit your AI page
Vercel gives you a URL like:
```
https://codequestlog-ai.vercel.app/codequestlog-ai.html
```
or just the root (auto-redirects):
```
https://codequestlog-ai.vercel.app
```

---

## STEP 6 — Link from your game site
On your InfinityFree site's `index.html` (your gaming homepage), add a button:
```html
<a href="https://codequestlog-ai.vercel.app/codequestlog-ai.html">🤖 Try CodeQuestLog AI</a>
```

The back arrow on the AI page links to `https://codequestlog.great-site.net`.

---

## Why Vercel works here
Vercel's Serverless Functions run in Vercel's own cloud infrastructure and are
built specifically to call external APIs like Gemini. Unlike InfinityFree's free
PHP hosting (which blocks outbound calls), there's no such restriction here —
and unlike the earlier Cloudflare attempt, Vercel's "Add New Project → Import
from GitHub" flow reliably creates the right project type with zero ambiguity.

---

## Notes
- ✅ Gemini key lives only in Vercel's environment variables — never in your code.
- ✅ 50 messages/day limit tracked per-browser via localStorage.
- ✅ Totally free for this kind of personal project, no credit card required.
- ⚠️ If `/api/chat` ever 404s, double-check the `api` folder uploaded correctly to GitHub with `chat.js` inside it (not flattened into the root).
