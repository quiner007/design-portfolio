# quinrichards.com — portfolio

Static site (plain HTML/CSS/JS, no build step). Mid-century "attraction poster"
design system. Every page is a standalone `.html` file at the repo root.

## Pages
- `index.html` — home (featured **Cue** + selected work)
- `cue.html`, `beamdown.html`, `eldritch.html`, `lightkeeper.html` — case studies
- `showreel.html`, `journal.html`, `about.html`, `sidequests.html`

`css/style.css` and `js/main.js` are shared by every page except `cue.html`,
which is self-contained. `.nojekyll` tells GitHub Pages to serve files as-is.

## Deploy on GitHub Pages (one-time)
Recommended repo name: **`<your-username>.github.io`** — this serves the site at
`https://<your-username>.github.io/` (clean root URL, easiest for a custom domain).

```bash
# from inside this folder
git init -b main
git add .
git commit -m "Portfolio site"
git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a
branch → Branch: `main` / `/ (root)` → Save.** Live in ~1 minute.

(If you name the repo something else, e.g. `portfolio`, the site lives at
`https://<your-username>.github.io/portfolio/`. All links here are relative, so
that works too.)

## Editing from here on
Every push to `main` redeploys automatically.

```bash
# quick edits straight to main
git add .
git commit -m "Update Beamdown copy"
git push
```

Prefer reviewing changes first? Use a branch + pull request:
```bash
git checkout -b update-eldritch
# ...make changes...
git add . && git commit -m "Add Eldritch case study"
git push -u origin update-eldritch
# open a PR on GitHub, then merge into main -> auto-deploys
```

### Preview locally before pushing
Open with a local server (needed for the résumé modal + showreel embeds):
```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Custom domain (quinrichards.com) — optional, after first deploy
1. Add a file named `CNAME` at the repo root containing one line: `quinrichards.com`
2. At your DNS provider, point the domain at GitHub Pages:
   - `A` records for the apex → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - `CNAME` for `www` → `<your-username>.github.io`
3. GitHub **Settings → Pages → Custom domain** → enter `quinrichards.com`, enable
   **Enforce HTTPS**. DNS can take a bit to propagate.

## Where assets go (drop-in points)
Files are referenced by relative path; drop them in and they replace the labeled
placeholders automatically.

- **Beamdown** — `assets/beamdown/` — DONE (hero, title-card, design-pillars,
  combat-loop, level-map, production)
- **Eldritch** — `assets/eldritch/` — `hero.jpg` `concept.jpg` `gameplay.jpg` `production.jpg`
- **Lightkeeper** — `assets/lightkeeper/` — same four names
- **About** — `assets/quin-1.jpg`, `assets/quin-2.jpg` (~4:3)
- **Side Quests** — `assets/omni.jpg` `assets/animal.jpg` `assets/quintessential.jpg` `assets/players.jpg` (16:9)
- **Cue music** — `assets/music/` — `lovelorn.m4a` `copper.m4a` `flowershop.m4a` `leap.m4a` `woody.m4a`
- **Résumé** — `assets/resume.pdf` — DONE

Heroes ~16:9 at ~1800px long edge; other images ~1600px; keep each under ~500KB.

## Notes
- `quin-site-preview/` (from the build handoff) is **not** part of this repo — it
  only exists so pages render inside a chat preview. Do not commit it.
