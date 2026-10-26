# Project notes

Static, dependency-free portfolio site. All content lives in `data/profile.json`
and is rendered client-side by `assets/js/main.js` (site) and
`assets/js/resume.js` (printable resume). To change wording, edit the JSON — not
the HTML.

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Static dev server on http://127.0.0.1:5173 |
| `npm run pdf` | Renders `resume.html` → `assets/resume/Narendra_M_Resume.pdf` |
| `npm run og` | Renders `scripts/og-template.html` → `assets/img/og-image.png` |
| `npm run avatar` | Restyles `assets/img/avatar-source.*` → `assets/img/avatar.png` |
| `npm run build` | `pdf` + `og` |

The generators drive headless Chrome. On macOS they use
`/Applications/Google Chrome.app`; override with `CHROME_PATH`.

## Regenerating the avatar

`npm run avatar` accepts crop overrides in **source-image pixels** (4:5 ratio,
i.e. `ch = cw * 1.25`):

```
node scripts/generate-avatar.mjs --cx=2920 --cy=1274 --cw=1150 --ch=1437
```

Those values are tuned for the current source photo: a 5196x7790 original in
which the subject stands on the right of a two-person shot. The crop
deliberately starts at x=2920 to exclude the second person — Vision segments
*all* people in frame, so anything left of that boundary reappears as a
detached fragment in the cut-out. Notes:

- Chrome applies EXIF orientation automatically, so a rotated phone photo is
  already upright by the time it is cropped — use *display* coordinates.
- Background removal runs on macOS via `scripts/cutout.swift`, which uses
  Apple's Vision person-segmentation model to write a transparent
  `avatar-cutout.png`. The browser template then composites that over the
  themed gradient. This replaced MediaPipe, whose WASM model stalls
  indefinitely in headless Chrome without a GPU (and whose UMD bundle exports
  nothing, so `import()` could never have resolved it). Off macOS the cut-out
  step is skipped and the raw crop is used.
- On non-Windows the script writes `avatar.png`. The published asset is
  `avatar.jpg`; shrink it with
  `sips -s format jpeg -s formatOptions 82 avatar.png --out avatar.jpg`
  (~900 KB → ~150 KB) and update the reference if you change the extension.

## Verifying generated assets

Always check the *content*, not just that the file exists. A misconfigured local
server previously produced a valid-looking 64 KB PDF that was actually a Chrome
"site can't be reached" error page. A healthy resume PDF is ~250 KB and exactly
2 pages; extract its text and confirm it contains the experience bullets.

## Resume content

The printable resume uses resume-only fields so the site can stay richer:
`resume.headline`, `resume.summary`, `resume.skills` (single-column rows — a
two-column grid scrambles in ATS text extraction), and per-role
`experience[].resumeBullets` / `resumeTech` (fall back to highlights+achievements
/ tech). `resumeOptions` gates Project Experience and Personal Details (both off:
they duplicated the job history / aren't hiring criteria). Keep one bullet per
achievement, number first, ≤5 per role.

## Deployment

Push to `main`; `.github/workflows/deploy.yml` publishes to GitHub Pages. The PDF
and OG image are generated locally and committed, so CI needs no browser. Run
`npm run build` and commit the results whenever `data/profile.json` changes,
otherwise the downloadable resume goes stale.

`meta.siteUrl` in `data/profile.json`, `robots.txt` and `sitemap.xml` all hardcode
the published URL — update all three together if the repo name changes.

Keep `profile.resumeFile` explicitly relative (`./assets/resume/...`). The
renderers' URL safety helpers reject bare relative paths (`assets/...`) as `#`,
which breaks both the portfolio résumé link and the résumé-page download link.
