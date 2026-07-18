# ArcBlade Works

Marketing/storefront site for a (fictional) precision power-tool brand. Static,
vanilla HTML/CSS/JS — no build step, deployable as-is to GitHub Pages.

## Design system — "Workshop paper & ember"

A warm, light, premium-storefront look that matches the brand's orange + slate
logo. Display type is **Bricolage Grotesque**, body text is **Hanken Grotesk**,
and labels/prices use **Spline Sans Mono** for a spec-sheet feel.

| Token | Value | Use |
| ----- | ----- | --- |
| `--paper` | `#FAF6EF` | page background (warm bone) |
| `--paper-2` | `#F2EBDF` | alternate bands |
| `--card` | `#FFFFFF` | cards / surfaces |
| `--ink` | `#211B14` | text (15:1 on paper) |
| `--ember` | `#C2410C` | accent — buttons, badges (AA with white text) |
| `--ember-deep` | `#9A3412` | links / small accent text (6.8:1 on paper) |
| `--coal` | `#211B14` | dark bands: footer, newsletter |
| `--pine` | `#2F5D3F` | in-stock / success |
| `--gold` | `#B45309` | review stars |

All tokens, type scale and shared components (header, footer, buttons, product
cards, tiles, testimonials, forms) live in **`css/styles.css`**.

## Structure

```text
index.html        Store landing — hero with floating deal chips, trust strip,
                  category tiles, featured products, testimonials, newsletter
showcase.html     Shop — flagship feature card + filterable product grid
specials.html     Deals — offer cards with save-badges
about / team / training / media / faqs / contact   Content pages
template.html     Blank page scaffold using the shared header/footer
css/              styles.css (global) + one file per page
scripts/script.js Drawer, reveals, lerped scroll motion, lazy video, shop filter
```

## How it works

- **Scroll reveal** — `scripts/script.js` adds `.reveal` via
  `IntersectionObserver`; children of `[data-stagger]` containers get an
  incremental `--reveal-delay`, so grids cascade in.
- **Smooth scroll motion** — parallax (`data-parallax`) and the rotating hero
  blade (`data-blade`) are driven by one rAF loop that *lerps* toward the
  target value and sleeps when settled — buttery motion, no jitter, near-zero
  idle cost.
- **View transitions** — `@view-transition { navigation: auto }` gives soft
  cross-page fades in supporting browsers (progressive enhancement).
- **Shop filter** — `showcase.html` filters product cards by category with
  `aria-pressed` chips and a polite live region announcing the result count.
- **FAQ accordions** — native `<details>/<summary>` (keyboard + screen-reader
  friendly), animated via `::details-content` where supported.

## Accessibility

- Skip-to-content link, `:focus-visible` rings and landmark roles on every page.
- Text never sits on photos; all colour pairs meet WCAG AA (body text ≥ 4.5:1).
- Drawer menu: `aria-expanded`/`aria-controls`, Escape closes and returns focus.
- `prefers-reduced-motion` disables reveals, parallax, blade rotation and view
  transitions; content renders fully without JS.
- Data table uses `scope="col"`, a caption and a focusable scroll region.

## Performance notes / TODO

The largest assets are **not** optimised and should be before a real launch:

- `media/product_video.mp4` — **~98 MB**. Uses `preload="none"` + poster and the
  source is only attached on first play, but it should be compressed (or hosted
  on YouTube/Vimeo).
- `images/training-main-banner.png` — ~1.6 MB; re-export as WebP/AVIF.
- `images/welcome_image.avif` — ~860 KB and currently unreferenced; remove or reuse.

Fonts load with `preconnect` + `display=swap`, only the weights in use.
