# EquityClimb v13: Simple Deployment Guide

## Step 1 — Back up the existing version

Open the current EquityClimb app → Settings → Export backup. Download and save the JSON. In GitHub, download a copy of the current source repository before replacing any code. If you rely on live user cloud sync, do not delete or change the existing D1 database.

## Step 2 — Upload all project files

Open the ZIP and find the `EquityClimb/` folder. **Upload the files and folders INSIDE it to the root of your GitHub repository**, preserving the `public/` and `functions/` folders exactly. Replace old files when matching names exist. Do not upload the ZIP itself as the only repository file.

Recommended: use a new branch or a fork to trigger a Cloudflare preview deployment first. Avoid changing your live site until you have tested the preview.

## Step 3 — Keep your existing Cloudflare settings

- Cloudflare → Workers & Pages → EquityClimb → Settings.
- Build output directory: `public`.
- Build command: **empty**.
- Worker AI binding name: `AI`.
- D1 binding name: `DB` — retain its existing database (do not create a replacement).
- If using cross-device login, preserve existing sync secrets and Firebase settings.

A newly added variable in `wrangler.toml` is `HOMES_PUBLIC_ENABLED = "off"`. Leave this off at first. This allows the Homes page to launch safely without claiming the app has live MLS inventory.

## Step 4 — Test the preview

- [ ] Home shows the new next step and weekly actions, without losing your previous cards.
- [ ] Homes tab appears in the main menu (and on the mobile bottom tab bar).
- [ ] Homes → Discover lets you choose a city, budget and minimum bedrooms.
- [ ] Without a licensed feed, the page says **live feed pending**, rather than inventing listings.
- [ ] REALTOR.ca / Zolo buttons open official websites in new tabs.
- [ ] Homes → My shortlist → add a manually entered home; save and delete work.
- [ ] Analyze costs opens the Decision Lab and fills the purchase price.
- [ ] Changing the mortgage rate updates estimated monthly totals.
- [ ] Existing Budget, Debt & Mortgage, Goals, Investing, Market, Learn, Copilot, sign-in and backup functions still work.
- [ ] On mobile, fields don't overflow and the home layout stacks vertically.

## Step 5 — Enable actual MLS listings later (optional)

Get written permission from the appropriate listing-data vendor and confirm licence rights for your actual public deployment domain. Choose a plan that includes the Canadian markets you wish to display. Then:

1. Cloudflare dashboard → Settings → Variables and Secrets → add `REPLIERS_API_KEY` as a **secret**. Never commit it to GitHub.
2. Turn `HOMES_PUBLIC_ENABLED` from `off` to `on` in the correct production configuration only after you have completed the display, attribution, lead-routing and privacy requirements under your agreement.
3. Redeploy. Search your authorized city and verify properties, photos, brokerage/agent attribution and removal of expired listings.
4. Check that your agreement permits the particular card view, map view, MLS-ID saving and cost comparisons you intend to operate; adjust the implementation if required.

See `HOMES_DATA_LICENSE.md` before enabling live inventory. If no feed is configured, the Homes page continues to offer manually entered comparisons.

## Step 6 — Test, then publish

Run `npm test` if you have Node installed. Verify your preview website with fresh browser storage and with an existing saved account. After testing, merge the branch to your production branch and monitor Cloudflare deployment logs and user feedback.

## How to roll back

In Cloudflare Pages, select a previous successful deployment and roll back (where supported). Or revert the GitHub commit / merge commit, which triggers a new deployment. You can always import your saved personal finance JSON backup from EquityClimb Settings.

**Important:** A green Cloudflare build alone does not prove that Firebase sign-in, live APIs, MLS rights or all country-specific mortgage rules are configured correctly.
