# EquityClimb v15.3 — Release notes

This release improves presentation only. There are no changes to finance engines, data keys, MLS feed licensing, or AI API billing.

**Home:** Primary financial KPIs and monthly indicators first; Market remains visible. Longer-term net-worth projection and personalized opportunities are collapsed into **Projections & opportunities**, and learning, financial health, Money Minute and weekly challenges are collapsed into **Financial health, learning & weekly goals**. Both panels expand on demand; their open/closed state is stored locally.

**Navigation:** Renames the navigation label `Homes` to **Real Estate** on mobile, desktop, and More, while retaining the existing `#homes` route, property shortlist, and housing functionality. The Home tab remains Home.

**Mobile:** Retains existing safe-area and fixed bottom navigation rules from v15.2.

**AI:** No new provider connection has been made. Unconfigured OpenAI and Anthropic API models stay grouped as Not connected. Cloudflare free-allowance models remain the default.

**Testing:** 25 automated Node tests, JavaScript syntax checks, and Chromium in-memory rendering checks on phone (390px) and desktop (1365px). Tests used sample financial data and mocked API responses. No production Cloudflare deployment, real iPhone Safari/Home Screen verification, or external AI/MLS integration testing was performed.
