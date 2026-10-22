# Install EquityClimb v15.1 (complete v15 + mobile fix)

For `manvirt97/equityclimb` → Cloudflare Pages `equityclimb`.

## Before uploading

1. On GitHub, open your existing repository and use **Code → Download ZIP** to back up the currently deployed code.
2. In the currently deployed app, use **Settings → Export Backup**, if you have saved financial data. Keep that JSON private.
3. Download **EquityClimb_v15_1_Mobile_Fixed_Complete.zip** and unzip it on your Mac. Open the **EquityClimb** folder containing `functions/`, `public/`, `tests/`, and `wrangler.toml`.

## Upload

1. On GitHub, open `https://github.com/manvirt97/equityclimb`.
2. Select the branch **main** if you intend to deploy directly to production. This triggers an automatic Cloudflare production deployment.
3. Click **+ → Upload files**, then from Finder select **everything *inside* the extracted EquityClimb folder** (Command-A) and drag the selection to GitHub. **Do not** upload the ZIP itself or an extra enclosing `EquityClimb/` directory.
4. Verify the upload list contains `public/ec-v15.css`, `public/ec-v14.css`, `public/ec-v15.js`, `public/index.html`, `public/sw.js`, and `functions/api/ai-router.js`. The paths may appear with `/` rather than folder icons; that is normal.
5. Enter commit message: `EquityClimb v15.1 - Fix mobile layout and launch v15`.
6. Choose **Commit directly to main** only after the backup and file-path check. Click **Commit changes**.

## Cloudflare

1. Open the Cloudflare dashboard → **Workers & Pages → equityclimb → Deployments**.
2. Look for the new commit and a **successful Production** deployment.
3. No new binding is needed for the default free AI route if your existing `AI` and `DB` bindings are configured. The optional OpenAI and Claude credentials remain unset. Leave `HOMES_PUBLIC_ENABLED = "off"` without appropriate MLS authorization.

## Test on your phone (essential)

1. Open `https://equityclimb.pages.dev` in Safari or Chrome on your iPhone.
2. You should **not** see the desktop navigation list filling the screen. Instead, see the actual dashboard and a six-item bottom bar (Home, Budget, Debt, Homes, Copilot, More).
3. Tap **Budget**, scroll through cards 1–5, edit a number and verify the figures update. Tap **Homes**, **Copilot**, **Home** and **More**. Inside **More**, open **Homebuying Guide**.
4. Confirm all pages have readable content and no horizontal scrolling. Change screen orientation and retest.
5. If you installed the app to your Home Screen, fully close it and reopen while online after deployment; if the old version persists, test the Safari website directly first. Because the service-worker cache version changed, the installed app should pick up the fix once its update activates.
6. Also test the desktop site and confirm that the left sidebar and Prime-rate footer still work.

If Cloudflare deployment fails, open **Deployments → failed deployment → build logs**. Do not randomly change variables or delete folders. Restore the last successful deployment via Cloudflare's rollback action, and revert the new GitHub commit if necessary (a Cloudflare rollback alone does not revert GitHub or user data).

## What this update does *not* do

It does not activate licensed MLS data, provide unlimited free paid AI models, or replace real-world legal and lender requirements for buying property.
