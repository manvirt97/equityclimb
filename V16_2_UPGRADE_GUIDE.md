# EquityClimb 16.2 — Installation

1. Back up your current GitHub project and export your personal EquityClimb data before updating.
2. Unzip the archive. Upload **contents of the `EquityClimb/` folder** to a preview branch of your existing GitHub repository. Verify that `public/ec-v16-2.js`, `public/ec-v16-2.css`, `public/index.html` and `public/sw.js` are in the expected directories.
3. Let Cloudflare Pages build the preview deployment. Verify the Home, Real Estate Decision Lab, Markets, Settings and mobile tab bar on desktop and iPhone. In Settings, tap Refresh all live data and observe the progress counter and result summary.
4. When validated, merge the preview branch into the main branch. In the iPhone web app, close/reopen it so the service worker refreshes. For persistent iOS PWA status-bar styling, remove/re-add the Home Screen icon only *after* backing up and confirming your account sync. Reinstalling may remove unsynced browser data.
5. Live MLS remains **off** until the authorized contract, credentials and display requirements are satisfied. No fictional property inventory appears.

Do not overwrite or clear browser localStorage to force changes, as this may erase personal financial data.
