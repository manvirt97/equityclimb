# EquityClimb v16.3 — Dark theme, navigation & mobile market fix

## Changes

- Added responsive theme-aware styles to the revamped Home, Real Estate and Settings cards; removed fixed white fills in dark mode.
- Added a small, accessible **Back** button at the top of non-Home pages. It returns to the previous in-app page or Home when no history is available; restores the relevant previous financial-planning tab when known. Legacy page rerenders are handled so the button remains present.
- New mobile default navigation: **Home · Budget · Real Estate · AI Copilot · Markets · More**. Existing nondefault custom layouts are left unchanged. A previously shipped original default automatically switches to the new default.
- Added a **Use these tabs** reset option in Settings, while preserving the four customizable shortcuts and starting-page preference.
- Fixed the huge blank market `Learn` box by limiting the inline SVG icon's width and height to 17 pixels and avoiding unnecessary height stretching.
- Updated service-worker cache key and version markers to **16.3**.

## Preserved

- No fictional property listings; live MLS remains disabled pending approved licensing and compliance.
- Financial data, user inputs, financial calculations, Canadian planner, locally saved shortcuts, other features and existing app URLs remain unchanged.
- `Refresh All` behaviour from 16.2 remains available.

## Validation & limitations

- Unit and regression test suite: 55 tests passing, plus JavaScript syntax checks.
- Phone-width offline Chromium rendering with local test data confirmed theme contrast, six default tabs, Settings selection, Back return and compact market note. A mock AI explanation was inserted only during the local rendering check.
- Full Cloudflare production, actual iPhone status bar, data provider integrations and live API responses have **not** been end-to-end verified. No rollout has occurred.
