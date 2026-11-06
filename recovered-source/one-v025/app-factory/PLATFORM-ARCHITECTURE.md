# Tabor 1-2-3 Factory — cross-platform plan

## First delivery: universal web app
- Responsive progressive web app for iPhone, Android, tablets, Windows, macOS, Linux, and supported browsers.
- Offline shell, install metadata, and home-screen icon.
- Native iOS/Android builds later through cloud CI (Expo EAS), subject to store accounts and signing.

## Integration architecture (planned, NOT implemented)
- Provider adapters: GitHub, Apple App Store Connect, Google Play, Kickstarter, social schedulers, investor portals, payment processors.
- OAuth where supported; otherwise server-side secrets vault; never expose API keys in frontend, repository, or logs.
- API proxy backend with per-user permissions, encrypted credentials, scoped tokens, audit log, rate limiting, retries and idempotency keys.
- Projects, artifacts, build jobs, release submissions, marketing campaigns and connector status stored in an authenticated database.
- Explicit approval gates for public publishing, payments, irreversible actions and credential grants.
- Unsupported platforms use guided handoff rather than pretending to offer universal access.

## Reality checks
- Browser hardware access varies by OS and browser; native features require platform-specific adapters and permissions.
- Offline shell does not provide offline cloud builds or synchronization.
- Do not place keys in GitHub Pages: it is static hosting and this repository is public.
- This is a roadmap, not proof of working API integrations.
