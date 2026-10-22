# Connecting OpenAI and Anthropic to EquityClimb (optional, billed separately)

**Nothing here is required to use the default free AI modes.** Do not turn paid access on until you understand charges and have explicitly chosen a budget.

## What v15.2 does now
- The free Auto / Quick / Balanced / Detailed modes use the existing Cloudflare `AI` binding and have per-network daily request limits via `DB`.
- Unavailable OpenAI and Claude modes are not selectable in the main AI dropdown.
- Expand **AI providers & connection status** in Copilot to see status grouped by provider.
- When a provider is correctly configured, that provider's configured model tier(s) automatically become visible in the grouped dropdown. We do not impersonate ChatGPT or Claude subscription models.

## To connect OpenAI API
1. Create your **own** OpenAI API platform account and review billing separately from ChatGPT subscriptions: https://platform.openai.com/.
2. Generate an API key at the API platform. Do not put it in a GitHub commit, message, screenshot, browser localStorage, or published JavaScript.
3. Cloudflare Dashboard > Workers & Pages > `equityclimb` > Settings > Variables and Secrets > Add. Enter name `OPENAI_API_KEY`, put your provider key in the Value field, choose **Encrypt / Secret**, then Save.
4. Select API model identifiers supported by your OpenAI account and the v15 AI Responses endpoint. Use the provider's own model list, not guessed model names: https://developers.openai.com/api/reference/resources/models/methods/list.
5. In the root `wrangler.toml` **under `[vars]`**, add only the non-secret names of validated models, such as `OPENAI_MODEL_FAST = "<validated-model-id>"`, `OPENAI_MODEL_BALANCED = "<validated-model-id>"`, and `OPENAI_MODEL_ADVANCED = "<validated-model-id>"`. Replace placeholders with actual permitted IDs; you can connect one tier before all three.

## To connect Claude API
1. Create a Claude API Console account at https://platform.claude.com and explicitly review its separate API billing.
2. Create a key in Claude Console; add it to Cloudflare as an **encrypted secret** named `ANTHROPIC_API_KEY`.
3. Review current active model IDs at https://platform.claude.com/docs/en/api/models/list and select tested models available in your account.
4. Add non-secret model IDs in `[vars]` of `wrangler.toml`: `ANTHROPIC_MODEL_FAST`, `ANTHROPIC_MODEL_BALANCED`, `ANTHROPIC_MODEL_ADVANCED` (you can start with one).

## Enable optional paid usage *only after* reviewing costs
1. In `wrangler.toml` under `[vars]`, change `ENABLE_PAID_AI = "off"` to `ENABLE_PAID_AI = "on"` (or keep it off to block both provider APIs).
2. Commit your TOML model-ID and enablement changes to GitHub. Trigger/confirm a fresh Cloudflare deployment so the secrets are bound to the deployed Pages Functions.
3. Open https://equityclimb.pages.dev/api/ai-catalog and confirm the tiers report `available: true` for the expected provider **without any secret keys in the response**.
4. Test ONE provider call with a simple question. Carefully monitor the provider's API usage and Cloudflare usage. `AI_DAILY_LIMIT` provides an app-side request cap but is not an effective spending cap for expensive provider requests; configure billing alerts/limits with each provider separately.
5. Keep `ENABLE_PAID_AI = "off"` unless intentional use and cost controls are in place. OpenAI/Anthropic APIs are not covered by a ChatGPT or Claude consumer plan.

**Security:** Production owner-paid AI APIs exposed on a public website also need appropriate authentication and per-user abuse protection. v15's IP/network quota is only a baseline, and visitors behind a shared IP share that allowance. Before enabling for broad public use, add authenticated per-user quotas and hard spend controls.

## Live MLS
This upgrade does NOT activate MLS. Keep `HOMES_PUBLIC_ENABLED = "off"` until authorized listing-data rights are available.
