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
node scripts/generate-avatar.mjs --cx=160 --cy=401 --cw=2000 --ch=2500
```

Those values are tuned for the current source photo. Notes:

- Chrome applies EXIF orientation automatically, so a rotated phone photo is
  already upright by the time it is cropped — use *display* coordinates.
- On non-Windows the script writes `avatar.png`. The published asset is
  `avatar.jpg`; shrink it with
  `sips -s format jpeg -s formatOptions 82 avatar.png --out avatar.jpg`
  (1.1 MB → ~180 KB) and update the reference if you change the extension.
- MediaPipe background segmentation is attempted but stalls in headless Chrome
  without a GPU. It fails soft, leaving the original photo background.

## Verifying generated assets

Always check the *content*, not just that the file exists. A misconfigured local
server previously produced a valid-looking 64 KB PDF that was actually a Chrome
"site can't be reached" error page. A healthy resume PDF is ~420 KB.

## Deployment

Push to `main`; `.github/workflows/deploy.yml` publishes to GitHub Pages. The PDF
and OG image are generated locally and committed, so CI needs no browser. Run
`npm run build` and commit the results whenever `data/profile.json` changes,
otherwise the downloadable resume goes stale.

`meta.siteUrl` in `data/profile.json`, `robots.txt` and `sitemap.xml` all hardcode
the published URL — update all three together if the repo name changes.
