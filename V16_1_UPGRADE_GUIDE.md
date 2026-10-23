# EquityClimb v16.1 — Safe Installation and Verification Guide

This is the **complete upgraded application ZIP**, not a small optional patch. It is designed for the existing GitHub + Cloudflare Pages project, and includes previous v15.4 and v16.0 improvements.

## Before changing your live app

1. Make a backup of your current GitHub repository using **Code → Download ZIP**, and store it separately.
2. In EquityClimb, use the **existing backup/export feature** to export your personal financial data, if applicable. Do not clear browser/site storage without an export.
3. For the safest preview, create a new GitHub branch (for example, `equityclimb-v16-1-review`), rather than replacing `main` immediately.

## Upload the ZIP contents, not another folder level

1. Extract `EquityClimb_v16_1_Real_Data_Visual_Refresh.zip` on your computer.
2. Open the extracted folder called `EquityClimb`. This folder contains `public`, `functions`, `tests`, `package.json`, `wrangler.toml` and documentation.
3. In GitHub, open your EquityClimb repository and the intended branch. Use **Add file → Upload files**. Upload the **contents** of the `EquityClimb` folder, preserving subfolder paths and overriding matching existing files in that branch. Do not nest them under `EquityClimb/EquityClimb` or duplicate `public/public`.
4. Commit changes with `EquityClimb v16.1 - Visual refresh, remove fictional listings`.
5. On Cloudflare Pages, verify the successful deployment of your selected branch/preview. Check build output for errors and keep the existing Functions, bindings and secrets unchanged.

## Confirm that v16.1 REALLY loaded

- Open your deployment in a standard browser (not just an installed shortcut). On the Home tab you should see a large **dark navy banner** with the words **YOUR FINANCIAL COMMAND CENTRE** and **VERSION 16.1**.
- Real Estate should show **Find the right home. Know what it really costs.**
- In the disconnected state, Real Estate should provide buttons **Browse REALTOR.ca**, **Add your property**, and **Open Decision Lab**, with **no sample houses** or fictional listing price cards.
- If the old display still shows, verify the GitHub branch really deployed and that `/ec-v16-1.js?v=16.1` and `/ec-v16-1.css?v=16.1` load without errors. `public/sw.js` now uses cache name `eq-v16-1-genuine-properties-refresh`.
- In a browser, do a **hard refresh** (Mac Chrome: Command + Shift + R; Windows Chrome: Ctrl + Shift + R). A PWA shortcut may need to be closed and reopened after the new service worker takes control. Avoid **Clear site data**, deleting local storage, or removing the installed app until your data is backed up.

## Safe rollback

If the new deployment fails, revert the GitHub commit or redeploy the previous known-good Cloudflare Pages deployment. Do not overwrite saved app data. The new release does not intentionally migrate or remove your financial records.

## Scope and limitations

This is a code and local-browser-tested package, **not yet installed on the live public site**. All licensed MLS flags stay off. Existing user-created home comparisons remain; fake property inventory has been removed. The app is a personal financial planning tool and does not replace a licensed professional, official lender quote or current government guidance.
