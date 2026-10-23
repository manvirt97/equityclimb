# EquityClimb 16.2 — Mobile polish and transparent affordability

- Financial Decision Lab now shows the quick calculation `available housing budget − monthly ownership cost = surplus/shortfall`, with an expandable breakdown using the same saved-income, non-housing essentials, lifestyle, existing debt and planned-savings inputs as the current model.
- Minimum down payment displays the applicable federal 5%/10% or 20% calculation beneath the estimate. This is a minimum, **not proof of loan eligibility**.
- PWA safe-area strip follows selected light/dark theme. Light/dark iPhone status bar styling is requested through app metadata; iOS may require reopening or reinstalling the installed web app for changes.
- Bottom tabs compacted and display padding reserved once on phones.
- Settings > Refresh all live data now shows actual progress, partial failures and an end-state message. It preloads market subtopic feeds for the selected geography, the default feed for all geographies, the deal tracker, rates, and Canadian rules; it does not generate AI content or regenerate saved neighbourhood guides in the background. These remain on-demand. Financial records are not cleared, and preloading uses browser local cache; news and rules still require internet access to update.
- Mobile Market Insights / Learn card height and vertical alignment normalized to avoid oversized blank cards.
- No fake listings or paid features added. MLS remains disconnected and gated.

Review required: security, data-protection, production device/iOS PWA, Cloudflare credentials, all financial-regulatory rules, data APIs and accessibility before production rollout.
