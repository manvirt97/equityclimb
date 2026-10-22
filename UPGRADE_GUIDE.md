# EquityClimb v14 — very simple GitHub & Cloudflare update

## What v14 fixes

- **Budget**: Two independent card columns eliminate large empty holes; the five cards alternate left/right in number order at wide desktop sizes, and return to true 1-2-3-4-5 order in one column on narrow screens. Existing calculations and values remain the same.
- **Navigation**: Sidebar grouped under Your Money, Explore, Grow Your Knowledge, and Account. Homes is easy to find; Learn and Copilot sit together.
- **Homes**: Smaller hero, city shortcuts, bathrooms filter, saved search criteria, location map (not fake listing pins), existing property shortlist and purchase analysis.
- **Backend**: Adds bathrooms filtering to the optional licensed Repliers adapter. The live feed is deliberately **OFF**.

## Install directly to your existing GitHub `main` branch

1. In the app Settings, export a data backup if you have entered personal numbers. Never upload this export to GitHub.
2. Open https://github.com/manvirt97/equityclimb, press **Code → Download ZIP**, and save your working code backup. Git history also preserves earlier commits.
3. Download **EquityClimb_v14_Complete.zip** and double-click it on your Mac to extract.
4. Open the extracted **EquityClimb** folder. You should see **functions**, **public**, **tests**, **wrangler.toml**, etc. Upload the **CONTENTS** of this folder, not the enclosing folder or ZIP.
5. Go to your repository on branch **main** → **Add file / + → Upload files**. Drag all content from the extracted folder. The upload paths should read `/functions/api/homes.js`, `/public/ec-v14.js`, `/public/ec-v14.css`, `/public/index.html`, `/public/ec-v13.js`.
6. Commit message: **EquityClimb v14 — Budget, Navigation & Homes Explorer**. Select **Commit directly to main** and save.
7. Go to Cloudflare → Workers & Pages → **equityclimb** → **Deployments**. The production deployment should start automatically. No new keys or build settings are required.
8. Visit https://equityclimb.pages.dev, refresh the browser, and confirm **Budget**, **Homes**, **Learn**, **Copilot**, **Home**, and **Settings** work. On Homes, click **Save this search**, change city and try the **Show interactive map** control.

## Leave Cloudflare as-is

- Repository: `manvirt97/equityclimb`
- Production branch: `main`
- Build command: empty
- Output directory: `public`
- Preserve existing D1 `DB`, Workers AI `AI`, Firebase configuration, and `SYNC_SECRET`.
- `HOMES_PUBLIC_ENABLED = "off"` stays **off**. You do **not** need a listing API key to use the planner, map, saved search criteria, or manual property comparisons.

## MLS listing rights: important before promising Realtor.ca / Zolo-style inventory

The Repliers API adapter supplied in v13 is only usable when the subscriber and website meet Repliers' **specific** MLS eligibility and approval rules. Repliers has stated that independent vendors generally cannot build their *own* third-party consumer websites on an agent's licensed feed.

For an independent EquityClimb property-search business, first explore CREA's **REALTOR.ca DDF Real Estate Advertising Website** program: https://www.realtor.ca/ddf/real-estate-advertising-websites. Approval is not guaranteed. Its agreement may require advertising-only use, routing inquiries to listing agents, attribution, data refresh, removal, etc. No DDF integration is included yet; it would be a **different backend implementation** once approval, terms and feed access are known.

Don't scrape MLS portals, copy listing photos or use sample feed listings as though they are real.

## Quick problem solving

- New section missing: confirm `/public/ec-v14.js`, `/public/ec-v14.css` and `/public/index.html` were committed under the correct folders.
- Old layout: use a hard refresh (Mac Chrome: Command + Shift + R), or open a private browser window. Service worker cache key was bumped to `eq-v14`.
- Deployment fails: open Cloudflare → Deployments → Failed deployment → Build logs. Existing Cloudflare bindings are unchanged by this package.
- No listing feed: expected; live listings are *not* included.
- Map won't load: it uses a third-party map library and public tiles for small-scale testing; your budgets and saved homes still work.
- Rollback: Use Cloudflare's Deployments list to roll back to your last known successful production deployment; **also revert the v14 GitHub commit** before deploying future changes. This does not restore deleted user data or database changes.

## Testing completed

- JavaScript syntax and automated calculation/API tests ran locally.
- Interactive browser navigation couldn't be confirmed in the working environment (the browser blocks local file/localhost pages). Therefore the live site still needs user acceptance testing before broad promotion.
