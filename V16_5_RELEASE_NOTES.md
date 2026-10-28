# EquityClimb v16.5 — Decision Journey (draft release)

## Purpose

Make the existing product more engaging by helping people **finish an actual homebuying decision**, rather than adding duplicate search bars or calculators. This release is implemented on the main v16.3 baseline and deliberately excludes the redundant v16.4 Discovery Studio draft.

## Implemented

- **Contextual Home decision brief** replaces the existing generic connected-plan suggestion. For users with manually saved homes, highlights the currently focused home (or finalist / viewed / most recently saved home), showing estimated cost and an action to continue the decision.
- **Less Home clutter:** removes only the old generic Start Here and Learn/Decide promotional cards, while preserving the weekly tasks, budget and mortgage metrics, other modules, and financial notices.
- **Real Estate → My shortlist → Property Decision Board:** display real user-entered properties with asking price, estimated monthly ownership, upfront cost, and a +2 percentage-point rate scenario, using `ECMoney.ownership` with the saved Decision Lab assumptions. Retains the original Add Home form, original saved-property cards and Analyze Costs actions. Replaces only the duplicated legacy static comparison table.
- **Buying stages and notes:** Considering, Visited, Finalist, Passed. Save personal property-specific notes (maximum 500 characters), a focused property, and sort/filter preferences within `S.ec165`. Nothing is retrieved from the internet to generate stages or notes.
- **Transparent affordability checks:** compare estimates to monthly income minus entered non-housing spending, debt and savings, plus recorded cash minus estimated upfront cash. Flag nonstandard down payments and insurance review before treating a scenario as feasible. Explain that FHSA/RRSP and other funding are not automatically counted and the same down payment is used on every home.
- **Rate sensitivity:** switch between the saved mortgage rate, +1 pp and +2 pp without changing the global mortgage-rate settings.
- **Copilot handoff:** explicitly tapped button fills a proposed AI question with property price and the ownership estimate, but **does not transmit** a street address, viewing notes, or saved financial profile. The user reviews and chooses Send.
- Responsive and theme-aware styles with mobile stacking, keyboard focus styling, reduced-motion support, semantic labels and an error notice for unsaved notes.
- Updated installable-PWA cache key and resources to make the new interface eligible to update when deployed.

## Out of scope until approved data providers / follow-up releases

- No licensed listing feed, listing photographs, real map pins, sold prices, neighborhood observations, automatic price-change detection, push/email listing notifications, or autonomous market valuations.
- No paid API signup, new account scopes or AI spending.
- No claims that individual property addresses, financial facts or changed prices are independently verified.

REALTOR.ca DDF requires an approved real-estate advertising website agreement, permitted site/app, attribution, lead service, analytics, and up-to-date removal of expired listings. Reference: https://support.crea.ca/DDF/Home/reaw

## QA and rollout

1. GitHub Actions: `npm test` and `npm run syntax`; new `tests/v16-5-engagement.test.mjs` covers costs, stages, cash gaps, privacy, retained original saved list and PWA assets.
2. Cloudflare Pages branch preview: test both themes, fresh and existing account, phone 360px / 390px / tablet / desktop, especially Home and Real Estate → My shortlist.
3. Test data migration: existing `S.ec13.homes.saved`, financial inputs, account sync and existing saved mobile shortcuts must not change. Check storage errors.
4. Test accessibility: visible focus rings, labels, long user-entered addresses and high zoom; verify no jumping on stage change.
5. Confirm actual production bindings, integrations and update propagation, and get approval before merging into main or deploying.

## Next development slices

1. Proper licensed-MLS property imagery, maps, history and alerts only after data agreement and verified compliance.
2. User-controlled homebuying progress views and real saved-data changes between visits (not fictitious "today" events).
3. Neighbourhood comparison using properly sourced and dated facts, with data recency and provenance.
4. User research: measure useful engagement (repeat saved-property comparisons, completed decisions), not compulsive opens or arbitrary streaks.
