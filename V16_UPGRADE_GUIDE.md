# EquityClimb v16.0 — Safe Installation & Verification

## Before replacing anything
1. **Save a copy of the current GitHub repository or branch** (Code → Download ZIP / create a tagged release).
2. In your current deployed app, open Settings → **Export backup** and save a copy of user-entered data. If multiple people use the app, each user should back up their own state.
3. Keep copies of any Cloudflare Pages environment variables, D1 configurations and deployment-specific settings using Cloudflare's recommended methods. Never put secrets into source files or a public GitHub repository.

## Recommended deployment workflow
1. Download and extract `EquityClimb_v16_Complete_Upgrade.zip`.
2. Open the **EquityClimb** folder inside it. Upload its *contents*, keeping the `public/`, `functions/`, `tests/`, and root files in their intended locations, to a **temporary preview branch** of your existing repository (or safely copy/commit it with Git). Do **not** create an extra `EquityClimb/` directory inside the Pages project if your current repo uses these folders at its root.
3. For Cloudflare Pages, continue using **public** as the output directory and no framework build command, consistent with the existing app. Retain required D1/Workers AI/environment configurations from your live project.
4. Review the Pages preview deployment first. Test the Home dashboard, budget figures, mortgage and Debt, Saved Homes, Decision Lab, Education, Canadian Toolkit, Settings, phone tab bar and data Export/Import using test-only data.
5. On a real iPhone and Android device, close and reopen the installed PWA and verify light theme, safe-area padding, touch targets, and mobile shortcuts. Clear the service worker cache/reinstall the PWA only if the deployment is genuinely using old cached assets, and only after safeguarding user data.
6. Release from your preview branch to production **only after** you are satisfied. Verify the app with your actual Cloudflare environment and production domains.

## New Settings choices
- Open **Settings → Personalization**. Choose your preferred phone startup page and four quick-access tabs. Home and More remain fixed.
- Optional rate and renewal reminders are **in-app**, not background notifications.
- The existing account sign-in/sync section remains under **Accounts & device sync** at the bottom of Settings. Your account features are not deleted.
- Appearance defaults to **Light** for new users; existing theme selections are respected.

## DDF / MLS access — do not turn on
- Leave `DDF_PUBLIC_ENABLED` and all CREA go-live approval flags **OFF** until CREA permission, brokerage/agent attribution, original listing links, rights, Lead API, analytics, data deletion/refresh and production reviews are complete.
- Nothing in v16 requires paid REALTOR.ca access. Live cards are not shown until a licensed source has passed its required checks.
- For the prior setup guidance see `CREA_DDF_LIVE_SETUP.md` and `V15_4_RELEASE_NOTES.md`.

## Checks available to run locally
```bash
npm test
npm run syntax
```
These checks passed in the build environment: 44 tests, 0 failures; syntax passed. They do not substitute for a production security/privacy, accessibility, Canadian tax/legal, or integration review.

## Data preservation
This is an incremental source-code upgrade on top of the original v15.4 app. Existing local data keys and backup flows are retained; the new customization state is added alongside existing user state. **Never delete local browser storage to force an update unless backups have been verified.**
