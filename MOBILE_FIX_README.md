# EquityClimb v15.1 — Mobile fix + full v15 features

**Use this ZIP rather than the earlier `EquityClimb_v15_Complete.zip`.** It includes *all* v15 features, plus the corrected mobile layout. This is a complete repository update, not just a CSS snippet.

## What was wrong

`public/styles.css` hides the desktop `.side` at screens 920px and narrower. But the newer `public/ec-v14.css` was loaded later and re-declared `.side { display:flex }` globally. Because it came later, the full desktop sidebar appeared on mobile and pushed actual content out of sight. The mobile tab bar still appeared, creating a confusing overlapping interface.

## What changed

- `public/ec-v14.css`: no longer overrides the base stylesheet's mobile sidebar visibility.
- `public/ec-v15.css`: defensively hides `#side` on phone/tablet widths, gives `#view` the entire viewport, and lays out the existing six-button bottom bar with safe-area padding. In the mobile layout, overlapping desktop-style floating AI/news buttons are hidden; AI remains in the Copilot tab, and news setup can still be opened from the Market page.
- `public/index.html`: CSS version bumped to 15.1 for cache refresh.
- `public/sw.js`: service-worker cache name bumped to `eq-v15-mobile-1` so installed web apps can pick up the correction.
- `package.json`: version 15.1.0.
- `tests/mobile-layout.test.mjs`: safeguards against accidentally reintroducing the original CSS regression.

The full v15 package includes the Homebuying Guide, free Auto AI routing with limits, optional owner-configured paid AI providers, and the provider-neutral housing schema. **Live MLS listings and paid APIs are not automatically enabled.**

## Tests

- 19 automated tests passed (`npm test`).
- JavaScript checks passed (`npm run syntax`).
- Chromium responsive UI checks using a sample local profile: 375px, 390px, 430px phone viewports, 768px tablet, 1440px desktop.
- Opened Home, Budget, Homes, Homebuying Guide, Copilot and More. Measured that main content fills the viewport and no horizontal overflow occurs at the tested widths.
- Mobile browser screenshots are in the accompanying conversation, produced from local files with mocked API responses. These do *not* represent a full real-device Safari or Cloudflare production integration test.

## Limitations

Tested browser layout and simulated navigation, but **not** a real iPhone Safari session, production Cloudflare bindings, external MLS feeds, or provider billing flows. Verify a Cloudflare deployment on your own phone before inviting others to use it.
