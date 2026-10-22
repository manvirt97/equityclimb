# EquityClimb v15.2 — Beginner installation guide

## What's fixed
- Home: the existing financial overview (Net Worth, monthly surplus, charts, opportunities, Market, and financial-health cards) appears before Homeownership Path, Smart Move, Learn, Decide, and This Week.
- All iPhone pages: reserve the top notch/status-bar safe area, so page titles are not covered in the Home Screen PWA.
- Copilot: clean Auto + Cloudflare selector, grouped OpenAI and Anthropic options only when the corresponding server connection is available; connection statuses appear in a separate expandable section.
- Existing finances and saved data: no changes to storage keys or mortgage/budget formulas.

## Installation (main branch, as requested)
1. In GitHub at https://github.com/manvirt97/equityclimb, click **Code > Download ZIP** to back up the CURRENT deployed code. Keep a separate private Settings > Export Backup JSON if you have saved financial data.
2. Download and unzip **EquityClimb_v15_2_Complete.zip**. Open the extracted `EquityClimb` folder and select everything INSIDE it (Command-A).
3. In GitHub, select **main**. Click **+ > Upload files** and drag the selected contents (folders and files). GitHub shows nested paths like `/public/ec-v15-2.js`: this is normal.
4. Before committing, ensure `/public/ec-v15-2.js`, `/public/ec-v15-2.css`, `/public/index.html`, `/public/sw.js`, and the old `/functions/api/ai-router.js` are present. Never upload a second outer `EquityClimb` folder. Do not delete old folders.
5. Enter commit message **EquityClimb v15.2 - Fix iPhone headers, Home layout and AI groups**. Select **Commit directly to main**, then commit.
6. Cloudflare > Workers & Pages > equityclimb > Deployments: confirm the new main commit's Production deployment succeeds. Keep `pages_build_output_dir = public`, build command blank, AI and DB bindings unchanged.
7. On your iPhone, open https://equityclimb.pages.dev in Safari to verify. If you use the installed Home Screen app, force-close it and reopen it while online so the service worker can update. If it shows old code, test the Safari website first.
8. Check the iPhone title on **Home, Budget, Homes, Copilot, More, Homebuying Guide**: none should be under the status bar. On Home, check Net Worth / Market before the new journey and weekly tasks. In Copilot, tap **AI providers & connection status**: OpenAI and Anthropic should be grouped and labeled honestly.
9. Recheck desktop sidebar, Prime rate footer, financial input saving, and any cloud sync you use. Test with sample figures first.

## Undo
Cloudflare > Workers & Pages > equityclimb > Deployments > previous successful Production deployment > `...` > Rollback (if available). Revert the new GitHub commit as well, otherwise another deployment may restore the broken code. A code rollback does NOT restore financial data or reverse database changes.

## AI providers
Default = free Cloudflare Workers AI within plan limits, plus owner-set request quotas. No paid keys required for v15.2. OpenAI and Anthropic remain inactive until YOU configure provider API accounts, paid access, secrets and model IDs. Follow `CONNECT_AI_PROVIDERS.md`. Never paste keys into GitHub or ChatGPT and never use them as browser input.

## Limits of testing
19 original automated tests + new source/layout regression checks, JS syntax, and a Chromium DOM rendering smoke test completed. A real iPhone Safari / standalone PWA top safe-area test and real Cloudflare AI provider tests were not possible from the local environment; confirm before advertising the release.
