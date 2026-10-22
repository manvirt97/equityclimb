# EquityClimb v15.3 — Beginner installation guide

**What changes:** Home becomes a compact financial snapshot with two optional detail panels; the `Homes` tab is renamed **Real Estate**. No financial formulas, profile data, accounts, MLS permissions, or API billing are changed.

## 1. Back up the working version

1. Open https://github.com/manvirt97/equityclimb .
2. Choose **Code → Download ZIP** and save it as a dated backup.
3. If you have personal financial data entered, also use EquityClimb **Settings → Export Backup**. Code backups and financial-data backups are different.

## 2. Upload v15.3 to the existing repository

1. Download `EquityClimb_v15_3_Complete.zip` from ChatGPT and double-click it on your Mac.
2. Open the **EquityClimb** folder inside the extracted ZIP.
3. Open https://github.com/manvirt97/equityclimb and ensure the branch selector is **main**.
4. Click **+ → Upload files** (or **Add file → Upload files**).
5. In Finder, select the **contents** of the extracted EquityClimb folder (`functions`, `public`, `tests`, and the root files) with Command+A. Drag them to the GitHub upload area.
6. Confirm that GitHub shows paths such as `/public/ec-v15-3.js`, `/public/ec-v15-3.css`, `/public/index.html`, `/public/sw.js`, and `/functions/api/homes.js`. Do not put everything into an extra top-level `EquityClimb` folder.
7. Use this commit message: `EquityClimb v15.3 - Simplify Home and rename Real Estate`.
8. Choose **Commit directly to main** only if you accept a production deployment, and click **Commit changes**.

**Do not paste private provider API keys into your public GitHub repository.** No new keys are necessary for this update.

## 3. Verify Cloudflare

1. Cloudflare dashboard → **Workers & Pages → equityclimb → Deployments**.
2. Locate the new Production deployment from main. A successful build should keep **Build command** empty and **Build output** as `public`.
3. Open https://equityclimb.pages.dev on both your computer and iPhone.
4. Check the Home sequence: Financial snapshot → Money in and out → Rates and market → optional projections → Your next steps → optional health/learning/weekly goals.
5. Open the **Real Estate** tab; it should open the same property-search page and preserve saved properties.
6. Expand both detail sections and verify their original content is still present. Check Budget, Copilot, and Homebuying Guide, too.
7. On iPhone, fully close and reopen the installed Home Screen web app if you see an older cached screen.

## 4. If anything breaks

In Cloudflare → EquityClimb → Deployments, find the last known good production deployment and use its **Rollback** action, if available. **Also revert the corresponding GitHub commit**, because a Cloudflare rollback by itself doesn't reset `main` or restore personal data. Do not delete the D1 database or change authentication secrets to attempt a rollback.

## 5. AI provider expectations

* **Cloudflare Workers AI:** configured default, within applicable daily free allowance and project limits.
* **OpenAI API:** ChatGPT Free/Plus/Pro plans do not automatically supply general API credits. Some API accounts may hold promotional credits, but they are not guaranteed or unlimited.
* **Claude API:** current developer pricing documentation describes small introductory credits for new users; these aren't an ongoing free tier. Certain paid Claude plans may separately include API credits.
* The app continues to display paid models **only when the server reports an authorized connection**. This update does not activate paid services or collect user API keys.
* Optional future alternative: a separate, explicit opt-in integration for an eligible Google Gemini API free tier, with a privacy disclosure and hard usage limits. Do not forward users' financial profiles to third-party free tiers by default.

## 6. Rollout principle

Update layout first, validate iPhone and desktop behavior, then consider additional integrations only after checking privacy, terms, and the actual cost per user.
