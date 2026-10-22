> **Current release: v15.3.** See `UPGRADE_V15_3.md` for deployment instructions and `V15_3_RELEASE_NOTES.md` for scope and limitations.

# EquityClimb v15.1 — mobile-fixed v15

A Canadian financial literacy and homebuying planning web app. Deploy through GitHub → Cloudflare Pages; static build output directory `public`, no build command.

**Start here:** Read `UPGRADE_GUIDE.md` (updated for v15.1) and `MOBILE_FIX_README.md`. The v15 AI and Homebuying features are included in this same package.

## Structure
- `public/`: UI and PWA assets, v15 includes `ec-v15.js`, `ec-v15.css`.
- `functions/api/`: Cloudflare Pages APIs, including AI router and Homes.
- `functions/_shared/`: rules, session and source-neutral listing rights schema.
- `tests/`: automated Node tests (`npm test`).
- `wrangler.toml`: Cloudflare Pages configuration; existing AI and DB bindings retained.

## Critical safety settings
- `HOMES_PUBLIC_ENABLED=off` is the correct starting state without MLS distribution rights.
- `ENABLE_PAID_AI=off` prevents paid model requests until owner opts in and configures paid API keys.
- `AI_DAILY_LIMIT=20` is a daily per-network safety cap; public access still requires operational abuse monitoring.

This application offers education and estimates. It is not a licensed brokerage, mortgage lender or law firm. Review provincial rules and professional requirements before acting on property transactions.
