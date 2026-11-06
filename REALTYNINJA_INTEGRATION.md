# Equity Climb: RealtyNinja IDX widget integration (gated)

## What this branch delivers
- Safe, optional embedded-iframe slot in **Real Estate → Discover homes**.
- Existing native feed search, user-owned shortlist and Decision Lab remain unchanged.
- Default is **OFF**. No provider account, active listing feed, API keys, MLS records, or photos are invented.
- No external scripts are injected into Equity Climb's main financial-planning application.

## Important eligibility requirement
RealtyNinja says its MLS/IDX Widget is **built for Canadian real estate agents**, for use on one registered domain per account. Equity Climb is not automatically eligible as an independent consumer finance app. Confirm this exact business model and the production domain with RealtyNinja **before activation**. Trial notices must not be hidden.

Provider docs:
- https://www.realtyninja.com/mls-idx-widget
- https://support.realtyninja.com/article/734-getting-started-guide-listings-only-idx-accounts
- https://support.realtyninja.com/article/311-can-i-use-the-realtyninja-listings-only-idx-embed-to-power-my-wordpress-sites-built-in-listing-functionality

## Activation checklist (not yet completed)
1. Get RealtyNinja approval for Equity Climb and register the exact website host (e.g. `equityclimb.pages.dev` if that remains the production host).
2. In the provider dashboard, configure the desired search and use **Manage Pages → View Embed Code**.
3. This initial integration is **iframe-only**. RealtyNinja's generated embed codes may instead require dynamic JavaScript; in that case, ask the provider for a supported direct HTTPS iframe URL or adapt the integration separately. **Do not** paste provider scripts into `public/index.html`, copy from another agent's account, or manufacture a URL.
4. Once there is an explicitly authorized, working HTTPS frame URL on a `realtyninja.com` subdomain, edit `public/ec-idx.js`: set `enabled: true`, `approvedHost` to the exact site hostname, and `iframeUrl` to the approved URL.
5. Test on the approved domain at mobile and desktop sizes: listing availability, maps, search/filter controls, lead forms, attribution, cross-site tracking disclosure, iframe display permissions, trial notices, navigation and failure states. A script-generated dynamic-size widget may require a different integration to avoid clipping.
6. Run `npm run syntax && npm test`, review the PR, then promote through normal deployment. Check the live page and Home Screen PWA update; don't treat merge or CI alone as proof the embed works.
7. Reconfirm that domain changes or additional websites do not violate the provider's one-domain policy.

## Technical boundary
An iframe is a separate, provider-run application. It **does not populate** Equity Climb's native property cards, mortgage calculations or saved records. Those need a separately authorized structured feed or user-entered data. Do not scrape or parse the iframe or read its contents with browser automation.

## Rollback
Revert the small `public/index.html` inclusion or leave `enabled: false`. All existing user financial data remains untouched.
