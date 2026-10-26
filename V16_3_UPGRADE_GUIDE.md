# EquityClimb v16.3 — Upgrade guide

1. Make a GitHub repository backup of the current v16.2 code. Separately export or back up any local EquityClimb financial data from the live app.
2. Extract `EquityClimb_v16_3_Theme_Back_Markets_Upgrade.zip`. The `EquityClimb/` folder contains the full site and functions. **Upload the contents of this folder** (not the enclosing ZIP) to a temporary GitHub branch first. Do not delete your existing Cloudflare settings, secrets or D1 database.
3. Let Cloudflare Pages generate a **preview deployment**, and check both desktop and mobile. Verify the Home banner says **VERSION 16.3**. The phone nav should read Home, Budget, Real Estate, AI Copilot, Markets, More for the previous standard layout. Custom layouts may remain unchanged unless you choose **Use these tabs** in Settings.
4. Test Light/Dark in Settings, visit Budget then **Back**, open Real Estate, and inspect the Market `Learn` box after a successful AI explanation.
5. Once the preview looks right, merge into main and deploy. Hard-refresh the browser. On installed iPhone PWA, close/reopen after the new service worker activates. Do **not** clear site data or delete/reinstall the app before verifying an independent backup.
6. If the phone still shows the old design, verify the main deployment source and status. The v16.3 cache is `eq-v16-3-dark-back-market-tabs`.

### Important

The update uses locally retained settings and requires no MLS feed. Fictional listings remain excluded. It does not connect external accounts, incur AI provider charges, nor update Cloudflare for you. The local Chromium preview was not a physical-iPhone or live-feed production test.
