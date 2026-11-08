# quinrichards portfolio (static site)

Plain HTML, no build step. Every page works from this folder as-is.
The site starts in the visitor's light or dark mode, and the day/night button in the nav flips it any time.

## Go live on GitHub Pages (quiner007.github.io/design-portfolio)
Push to `main` and Pages redeploys in about a minute. Old URLs (`sidequests.html`, `rito.html`, `journal.html`, `showreel.html`) redirect to their new pages.

## Point quinrichards.com at it later (optional)
Add a file named `CNAME` containing `quinrichards.com`, then set the DNS records
GitHub lists under Settings > Pages.

## What's here
- `index.html` home and every case study (`cue.html`, `recruit-ops.html`, `beamdown.html`, ...).
- `cue-*.html` and `ro-*.html` are the clickable prototype screens.
- `assets/` images, videos, songs and the resume PDF. `dc.js` runs the interactive parts.
