# EquityClimb v14 — Money, Learning & Homes Explorer

This is a **complete GitHub + Cloudflare Pages project** for an existing EquityClimb deployment. The live website is served from `public/`; functions under `functions/api/` are deployed as Cloudflare Pages Functions. There is no production npm build command.

## v14 improvements

- **Budget:** removes large empty gaps between cards by using two independent vertical columns on desktop. Mobile has one orderly stack, 1–2–3–4–5.
- **Navigation:** grouped under Your Money, Explore, Grow Your Knowledge and Account; matching mobile More screen.
- **Homes:** a property discovery workspace featuring city shortcuts, saved search filters (including bathrooms), optional interactive city map, manual home shortlist, listing-feed search integration hook, and the v13 Financial Decision Lab.
- **Safety:** no fabricated MLS listings. Listing-provider code remains inactive until valid display rights and a suitable integration are in place.

## Installation

**Beginners:** Open `V14_UPGRADE_GUIDE.md` (also copied to `UPGRADE_GUIDE.md`).

1. Export your EquityClimb data in the live app, if any.
2. Back up your existing GitHub repository as a ZIP.
3. Upload the **contents of this folder** directly to your existing GitHub `main` branch, preserving `public`, `functions`, and `tests` paths.
4. Verify Cloudflare deployments, visit your existing website, and test Budget, Homes, mobile navigation, learning, data saving, and sign-in.
5. Leave `HOMES_PUBLIC_ENABLED = "off"`; no new credentials are needed for this UI release.

## Existing Cloudflare configuration

- Framework: none
- Build command: empty
- Output directory: `public`
- Existing `AI` Workers AI binding, `DB` database binding, `SYNC_SECRET` and Firebase settings: keep them unchanged.

## Real MLS feed eligibility (read before enabling)

Repliers' current published guidance restricts MLS access to real estate professionals and service providers working for them, **not** independent vendors wishing to run their own third-party consumer property portals. The backend Repliers adapter is retained but disabled. It is **not appropriate to activate it** based on an agent's credentials or a generic Repliers account.

For an independent EquityClimb advertising portal, start with CREA's REALTOR.ca DDF **Real Estate Advertising Website** application:
https://www.realtor.ca/ddf/real-estate-advertising-websites

If approved, a separate DDF server-side integration must be developed according to the actual agreement, including required agent attribution, advertising-only use, lead routing, data refresh/deletion, etc. The v14 package **does not** contain a DDF connection. Read `DDF_APPLICATION_PREP.md` and `HOMES_DATA_LICENSE.md` for details.

## Project files

- `public/ec-v14.js`, `public/ec-v14.css`: new navigation, budget columns, Homes workspace
- `public/ec-v13.js`, `public/ec-v13.css`: existing property search, manual shortlist and Decision Lab
- `public/ec-money-core.js`: mortgage/ownership calculations
- `functions/api/homes.js`: disabled-by-default Repliers adapter
- `tests/*.test.mjs`: Node tests — run `npm test`
- `wrangler.toml`: Cloudflare configuration

### Validation

Automated API and mortgage-calculation tests and JS syntax checks passed. Local browser-navigation testing was **blocked by the execution environment**, so verify the UI after deployment before promoting it to users. This release does not promise live Canadian housing inventory.
