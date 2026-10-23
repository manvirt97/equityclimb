# EquityClimb v15.4 — REALTOR.ca DDF Connection and Approval Guide

**Important status:** v15.4 contains an authenticated DDF connector and an owner-only diagnostic, but **it does NOT make nationwide MLS inventory live**. EquityClimb does not have your signed feed agreement or production credentials. Publishing requires additional contract-specific display, agent inquiry, analytics and data-refresh verification. Do not switch the DDF go-live flags on from this guide alone.

## 1. Request feed access from CREA

Go to: https://www.realtor.ca/ddf/real-estate-advertising-websites

Select **Apply now** and apply as a **Real Estate Advertising Website** for EquityClimb (`https://equityclimb.pages.dev`). Answer honestly about the ownership, company, product and commercial status. The application, eligibility and fee structure are determined by CREA — they are not free or automatic.

Ask CREA to confirm IN WRITING:

- Whether your specific EquityClimb website **and installed mobile/PWA experience** are eligible for DDF listings, and which domains are approved.
- Whether your use case (independent homebuying education, financial comparisons and AI explanations) is permitted.
- Which MLS areas/boards and listing fields are included, the treatment of optional brokerage opt-ins and excluded regions.
- Which photographs, descriptions, historical data, attribution badges and URL links you may display or save.
- The exact member/office keys needed for required attribution and the correct REALTOR.ca link field in the response.
- DDF Web API production credentials, lead API and analytics requirements, refresh/deletion rules, launch testing, pricing, and any contract-approved filtering.

Official technical reference: https://ddfapi-docs.realtor.ca/

**Note:** DDF is not the same as an unrestricted feed of every Canadian MLS board. Do not bypass regional board or copyright agreements by scraping public portals.

## 2. Upload the v15.4 update safely

1. In GitHub (`manvirt97/equityclimb`), select **Code → Download ZIP** to back up your current working v15.3 version. Separately export personal EquityClimb data, if you use that feature.
2. Download/extract the v15.4 package, open the folder named **EquityClimb**, and drag **its contents** into GitHub's **Upload files** screen on the `main` branch (or preferably into a temporary branch for preview).
3. Check the repository paths: `functions/_shared/ddf-client.js`, `functions/api/ddf-diagnostics.js`, `functions/api/homes.js`, `public/ddf-connection-check.html`, `public/ec-v15-4.js`, and `public/ec-v15-4.css`.
4. Commit with `EquityClimb v15.4 - Add official CREA DDF connector (locked)`.
5. In Cloudflare → Workers & Pages → equityclimb → Deployments, verify the successful deployment. The existing app continues to work, and MLS stays off.

## 3. Only after CREA gives you an authorized feed

CREA's Web API uses two confidential credentials: `client_id` (DDF feed username) and `client_secret` (DDF feed password). Never paste them into `wrangler.toml`, GitHub, browser JavaScript, your chat messages or public screenshots.

Cloudflare → Workers & Pages → `equityclimb` → **Settings** → **Variables and Secrets** → **Add**. Create these as **Secret** values (not ordinary visible text variables):

| Secret name | Value to enter |
| --- | --- |
| `DDF_CLIENT_ID` | Username / client ID given by CREA for your approved feed |
| `DDF_CLIENT_SECRET` | Password / client secret given by CREA |
| `DDF_DIAGNOSTIC_TOKEN` | Your own **random 32+ character secret** (generate it using a password manager) |

Save the three secrets and redeploy if Cloudflare requires it for them to take effect. **Leave `DDF_PUBLIC_ENABLED = "off"` and the four other DDF signoff flags set to `"off"`.** Do not change the existing `HOMES_PUBLIC_ENABLED` setting or Repliers settings unless you have separate approved Repliers access.

## 4. Check whether the credentials work

Visit:

`https://equityclimb.pages.dev/ddf-connection-check.html`

Enter only the diagnostic token YOU generated in the form. The site sends that token as an owner-only HTTP request header; it does not save it in localStorage.

Possible results:

- **Authenticated with CREA DDF** — OAuth connection works, but **the website is not authorized to display MLS properties until release requirements are met**.
- **DDF credentials not configured** — the two confidential feed credentials are missing from the deployed Cloudflare environment.
- **Authentication was rejected** — contact CREA to confirm your feed credentials and activation status.

You can also view a non-sensitive source summary at:

`https://equityclimb.pages.dev/api/homes?mode=sources`

## 5. Before public MLS activation

The DDF terms require a visible **Powered by REALTOR.ca** badge and original listing link, brokerage and REALTOR® identification, CREA's lead form/API, analytics reporting and timely removal of delisted records. The current v15.4 connector handles authentication and property data mapping; its complete CREA lead and analytics production workflows **are not yet commissioned or verified**. Brokerage and agent name fields must be tested against your real feed. This is a non-negotiable compliance blocker.

Before turning on any DDF public flags, complete and independently test: 

1. Approved feed agreement for all intended websites and mobile uses.
2. Original listing links, photos, hidden-address flags, agent names/titles, brokerage names and Powered-by badge on actual feed records.
3. Verified CREA Lead API inquiry handling and anti-spam protection; end-user inquiries must go to the listing agent.
4. Verified CREA analytics event reporting including event types and Destination ID.
5. At least daily reconciliation/deletion of inactive records (or on-demand fresh fetch with verified no-stale-cache guarantees) and board/feed coverage limitations.
6. Privacy/consent notice, security and performance testing on the Cloudflare production environment.

**Do not claim the connector is production ready solely because the authentication diagnostic succeeds.**

## Official sources

- https://www.realtor.ca/ddf/real-estate-advertising-websites
- https://support.crea.ca/DDF/Home/reaw
- https://ddfapi-docs.realtor.ca/
