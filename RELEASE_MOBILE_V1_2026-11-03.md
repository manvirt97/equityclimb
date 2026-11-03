# EquityClimb — mobile store v1.0 release gate (2026-11-03)

This is a **pre-release engineering and policy audit**, not an approval certificate. Source reviewed at `main` commit `9bfc0326cc06decfef66f29c8865b3e7c6e7c2eb`. No production changes or paid service activations are authorized by this document.

## Current architecture

- Static JavaScript/HTML/CSS PWA hosted on Cloudflare Pages (`public/`, `public/sw.js`), with Cloudflare Pages Functions in `functions/api/`.
- Cloudflare D1 optional encrypted profile sync (`functions/api/sync.js`, `functions/_shared/session.js`), Firebase Authentication via `public/ec-auth.js`, optional Cloudflare Workers AI.
- Marketplace providers: Yahoo Finance/Stooq quotes, news feeds, Bank of Canada rate sources. Licensed MLS connections are disabled by default. No evidence of a native iOS/Android build configuration.
- Existing `npm test` and `npm run syntax` scripts plus CI; **web tests are not native integration tests**.
- No verified mobile-native analytics or crash reporting. No paid in-app purchases/subscriptions seen in repository. Native permission manifest and platform SDK settings do not yet exist.
- JavaScript client session currently persists a 60-day bearer token in localStorage; session revocation/security model needs native-store review.

## Release blockers (do not mark complete without evidence)

1. **Native delivery** — no `ios/`, `android/`, signed `.aab`, archive, or TestFlight upload. Implement maintained Capacitor native shells only after verifying API-origin routing, WebView behavior, install persistence, and Apple Guideline 4.2 (not a trivial website wrapper). Do not use `server.url` as an unreviewed substitute for packaging the app.
2. **Login/account lifecycle** — Firebase web popup and email-link flows need supported mobile callbacks on both platforms. Provide reliable login/logout/reauth/passwordless recovery and a complete **Firebase Auth account + Cloudflare D1 data** deletion flow in Settings and a publicly reachable external deletion route. Separate deletion of synced data from deletion of the account; both must work. Consider Apple Guideline 4.8 privacy-preserving alternative login.
3. **Session security** — migrate native bearer sessions from JS localStorage to protected platform storage or a secure server-managed cookie with appropriate CSRF/SameSite protection. Introduce session revocation, renewals, and logout-all behavior, with migration/rollback testing.
4. **Regulated financial scope** — document that app provides user-driven financial planning/education, not brokerage/trading, personalized regulated investment advice, loan facilitation or licensed mortgage activity. Obtain legal review appropriate to distribution territories and Apple 3.2.1(viii). Do not assume a disclaimer substitutes for proper authorization if actual features constitute regulated services.
5. **Market data licensing** — `functions/api/quotes.js` uses Yahoo Finance and Stooq, and financial/news feeds are displayed. Confirm **commercial mobile redistribution rights** or restrict/replace any unlicensed feed before shipping mobile-store listings; verify attribution and freshness. MLS disabled until written rights and operational controls exist.
6. **Release artifacts** — official Apple/Google accounts and agreements, app identifier reservation, signing, icon at platform-required sizes, splash assets, screenshots captured from real approved builds, listing/privacy/Data Safety forms, support URL, testing tracks, review notes, and validated native builds are outstanding.

## Recommended release implementation

1. Freeze v1 scope: Home, Budget, Real Estate manual shortlist and mortgage illustrations, Copilot education, Market (only properly licensed feeds), Settings, export/import, guest mode and optional sync. Hide only nonfunctional/unlicensed live feeds with clear explanations; preserve user data and source code.
2. Create separate native workspace and keep Cloudflare APIs. Package the existing `public/` frontend for offline shell availability; route relative `/api/*` requests to explicit HTTPS production API origin using a reviewed single client transport layer and strict allowlist.
3. Keep sensitive tokens outside client-accessible storage; integrate native Firebase sign-in with verified redirect/deep links and account deletion.
4. Perform unit/integration, web device and native device QA on staging with synthetic accounts and synthetic financial data. Check network failures, reload, account switching, exports, calculations, small screens, accessibility, permissions, privacy, auth and all app-store links.
5. Build Android against **API 36 or later** (policy as of 2026-08-31), signed AAB, internal/closed test, then Play review. Build iOS using **Xcode 26 or later with iOS 26 SDK** (as of 2026-04-28), TestFlight, then App Review.
6. Publish only after checklists are independently verified, licenses approved, and user explicitly approves release. No unapproved spend, billing, account changes or production-data deletion.

## Specific code risks and status

| Risk | File(s) | Impact | Recommended action |
|---|---|---|---|
| Unmetered legacy AI endpoints | `functions/api/ai.js`, `functions/api/ai-chat.js`, `functions/api/ai-router.js` | Abuse/exhausted inference allowance; potential usage charges | Apply the existing D1 reservation guard and input validation; tests on this review branch |
| 60-day bearer token stored in browser JS | `functions/_shared/session.js`, `public/ec-v7.js` | Session theft could expose synced financial data | Secure native storage + short lifetime + revocation, tested migrations |
| No complete account deletion | `functions/api/sync.js`, `public/ec-auth.js`, `public/ec-v7.js`, Firebase | Apple/Google review and privacy blocker | Full account and data deletion, confirmation and external route |
| Finance planning scope and AI output | `functions/api/ai-router.js`, financial UI | Potential misleading advice/financial regulation | Educational language, assumptions, model caveats; regional counsel review |
| Quote redistribution | `functions/api/quotes.js` | License and app-store policy exposure | Written provider authorization or licensed alternative |
| No native signing/builds | root project | Cannot upload to either store | Native projects, signing, build/test |
| Privacy Data Safety mapping incomplete | `public/privacy.html` and backend integrations | Inaccurate disclosures | Inventory Firebase, Cloudflare, AI, geo, feeds, storage and retention; reconcile forms |
| Support web URL | `public/support.html` | Store required support path | Added on this branch; **not live until merged/deployed and verified** |

## Required test journeys before release

- Fresh install -> guest -> optional sign-in -> onboarding -> Budget -> net worth -> mortgages -> manual property shortlist -> rate/market pages -> Copilot -> Settings -> logout -> sign back in -> existing data intact.
- In-app complete-account deletion (including Firebase + D1) plus external deletion page; confirm stale sessions cannot retrieve data.
- Fresh and returning users; interrupted login; invalid/malformed inputs; 401/403/429/500; flaky/offline network; slow responses; AI model unavailability; quote/rate timestamps; local-to-native data import.
- iPhone compact and large phones, supported iPad if enabled, Android small/large phones, dark/light where supported, keyboard and screen reader, focus, Dynamic Type, reduced motion and back gesture.
- Restore from background, force quit, OS restart; external links; file export/import; local storage low-space; Cloudflare unavailable; service worker updates; cache invalidation; store release migrations.

## Store account tasks (owner-only, **do not purchase without approval**)

- Apple: https://developer.apple.com/programs/enroll/ ; program membership roughly USD 99 per membership year, regional variance. Set up and accept terms before signing/TestFlight/App Store Connect. Apple signing identities and app identifiers are managed in developer.apple.com/account.
- Google Play: https://play.google.com/console/about/ ; USD 25 one-time registration. Verify account identity, create the app, complete policies/forms. New personal accounts created after 2023-11-13 generally require 12 continuously opted-in closed testers for 14 days before production access.
- Bundle/application IDs are **proposals only**, e.g. `ca.equityclimb.app` if legitimately controlled and available; do not claim reserved.
- Official references: https://developer.apple.com/app-store/review/guidelines/ ; https://developer.apple.com/news/upcoming-requirements/ ; https://support.google.com/googleplay/android-developer/answer/11926878 ; https://support.google.com/googleplay/android-developer/answer/13849271 ; https://support.google.com/googleplay/android-developer/answer/13327111

## Cost gate
No billing, purchases, trial activations, Apple/Google enrollments, usage-based upgrades, native cloud-build purchases, paid market-data contracts, or publishing actions without owner's explicit approval.
