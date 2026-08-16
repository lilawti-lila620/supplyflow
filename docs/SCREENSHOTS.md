# Screenshots checklist

Capture these from your own running instance (local dev or your deployed URL) and
drop them in this folder before submitting. Judges are looking for evidence the
product actually works, so use real captures, not mockups.

- [ ] `landing.png` — Landing page hero
- [ ] `dashboard.png` — Dashboard with manifest list + stats
- [ ] `create-manifest.png` — Create manifest form with live split preview
- [ ] `manifest-detail-open.png` — An open manifest awaiting funding
- [ ] `manifest-detail-settled.png` — A settled manifest with the payout receipt
- [ ] `analytics.png` — Analytics dashboard
- [ ] `feedback.png` — Feedback page
- [ ] `mobile-dashboard.png` — Dashboard at a mobile viewport (~390px wide)
- [ ] `mobile-create.png` — Create manifest form at a mobile viewport
- [ ] `wallet-connected.png` — Freighter (or demo wallet) connected state in the nav
- [ ] `monitoring.png` — Your analytics/monitoring integration (see below)

## Monitoring & analytics integration

The submission checklist asks for "analytics or monitoring setup." Options that
plug into this project with minimal setup:

- **Frontend analytics**: add [Plausible](https://plausible.io) or
  [PostHog](https://posthog.com) via a script tag in `frontend/index.html`.
- **Error tracking**: [Sentry](https://sentry.io)'s React SDK — wrap `<App />` in
  `Sentry.ErrorBoundary` and initialize in `main.jsx`.
- **On-chain monitoring**: [Stellar Expert](https://stellar.expert/explorer/testnet)
  for watching the deployed contract's transaction history live — screenshot the
  contract's page there as your on-chain monitoring evidence.
