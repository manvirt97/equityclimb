# EquityClimb 13 — Homes & Financial Decisions

**Complete ready-to-upload project** for the existing GitHub → Cloudflare Pages deployment. The production website is served from `public/`. There is **no npm build step**. The Cloudflare Functions in `functions/api/` run on Cloudflare, not when opening `index.html` locally.

## First — protect your data and existing site

1. In your current live app, open Settings and **export your EquityClimb backup** if you have entered any real numbers.
2. In GitHub, download your current repository as ZIP or create a tagged release (for example, `pre-v13`).
3. Make a new GitHub branch, e.g. `equityclimb-v13`. Upload/commit **all contents of this folder** while preserving folders. Do not upload only the three new scripts.
4. Review the Cloudflare Pages preview deployment, test existing budget / mortgage / sign-in / learning / market views, then merge to your production branch.
5. Do not overwrite or recreate your Cloudflare D1 database. This release retains the existing D1 binding and user state format.

## Your Cloudflare Pages settings

- Git repository: your existing EquityClimb repo.
- Framework preset: None.
- Build command: leave blank.
- Build output directory: `public`.
- Pages Functions: auto-detected from `functions/`.
- Continue using your existing Worker AI `AI` binding, D1 `DB` binding, and existing `SYNC_SECRET` secret.
- `wrangler.toml` contains public Firebase configuration and `HOMES_PUBLIC_ENABLED = "off"`.

## What's new in v13

- **Homes:** city search, purchase/rental filters, optional licensed MLS results, listing cards, map, pagination, external REALTOR.ca / Zolo links, property shortlists.
- **My shortlist:** manually enter homes from an external portal and compare estimated costs; optional MLS-ID bookmarks store identifiers only.
- **Financial Decision Lab:** editable price, down payment, rate, amortization, taxes, insurance, utilities, condo fees, maintenance and closing-cost allowance. Monthly ownership cost and +1/+2 percentage point rate stress tests.
- **Home experience:** personalised next step, Learn/Decide entry points and an optional three-action weekly checklist.
- **Learn:** a clear pathway from learning to real decisions.
- **Budget:** sequential DOM/grid order for numbered cards. Removed the v12 height-driven column redistribution so cards don't appear numerically out of order.
- **Service worker** updated to cache later v7–v13 assets.
- **Automated tests:** `npm test` covers the housing API and transparent mortgage model.

## Listings — two stages

**Works immediately, without an API key:** the Homes page, selecting a city, opening approved external listing websites, manually adding properties, side-by-side comparison, map UI only when there are authorized coordinates, and the Decision Lab. It clearly states that no real-time listing feed is connected.

**To turn on live MLS inventory:** obtain **appropriate written public-display authorization** and a Repliers subscription / approved MLS feed (see `HOMES_DATA_LICENSE.md`). In Cloudflare, set the secret `REPLIERS_API_KEY` and **only after licensing is confirmed** set `HOMES_PUBLIC_ENABLED = "on"`, then deploy. Never place the API key in public JavaScript, the repository, or `wrangler.toml`.

⚠️ This is not an automatic free national MLS feed. Display, photographs, lead handling, attribution, update schedules and price histories all remain subject to the applicable data-provider/board agreement. Verify permitted fields and branding before enabling public display. The app does not scrape REALTOR.ca or Zolo.

## Source structure

```
public/                  # app assets and index.html, served by Cloudflare Pages
  ec-v13.js              # Homes UI, workflows, home/learn enhancements
  ec-v13.css             # styles for those experiences
  ec-money-core.js       # standalone and tested Canadian mortgage model
functions/api/homes.js   # server-side licensed Repliers adapter (off by default)
tests/                   # Node 20+ zero-dependency unit tests
wrangler.toml            # existing Cloudflare config + Homes flag
UPGRADE_GUIDE.md         # click-by-click deployment instructions
HOMES_DATA_LICENSE.md    # compliance and provider setup
CHANGELOG.md             # changes and limitations
```

To run local tests, install Node.js 20+ and run `npm test` from the repository root. Browser API calls require Cloudflare Pages local development or a deployed preview; simply opening files locally will not run Pages Functions.

Do not use property projections or tax estimates as underwriting or personalized financial advice. The Decision Lab intentionally labels excluded mortgage default-insurance costs, lender qualification and other limitations.
