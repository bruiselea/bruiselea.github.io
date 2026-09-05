# Feature plan: Hand Spinner on nuunnu.com

- Status: Verified locally; publishing
- Owner: Natsuki Sato / Codex
- Date: 2026-09-05
- Risk: Medium (public navigation and release-support content)

## Context and goal

The owner explicitly requested nuunnu.com and prohibited Sites. Publish Hand Spinner product, support and privacy pages anonymously on the existing portfolio domain.

## Non-goals

- No Sites operations, Cloudflare DNS/hosting changes, homepage redesign, app binary changes, pricing changes or App Store submission.
- Do not publish unrelated local work or recruiting access keys.

## Acceptance criteria

- `/works/hand-spinner/`, `/works/hand-spinner/support/` and `/works/hand-spinner/privacy/` return HTTP 200 without login on nuunnu.com.
- Works links to the product. Existing public pages remain available.
- English product copy uses the approved orange-accent icon and existing app artwork; it says Coming soon, not already released.
- Support explains first launch, Option-Space, Space + one finger, Escape, dragging and purchase restoration.
- Privacy distinguishes on-device preferences/input, Apple purchases and voluntary support email.
- No auth, analytics or external scripts are added to these static pages.

## Affected surface and risks

- Navigation: add a work and three static routes; exclude the custom product route from generic route generation.
- Privacy: no cookies, forms or accounts added; do not include private career data in this change.
- Existing behavior: default layout language remains Japanese; new pages use English.

## Approach and slices

- [x] Confirm production hosting: GitHub Pages workflow, bruiselea/bruiselea.github.io, nuunnu.com custom domain.
- [x] Read local AGENTS.md. Production source is a3202b1e52dd402918a1e1b245c765423a1d1452.
- [x] Add static pages and existing artwork; test generated output and browser layouts.
- [ ] Publish only this patch and verify live pages anonymously.
- [ ] Record replacement URLs in HandSpinner release metadata.

## Verification plan

- Focused Node tests against generated HTML: copy, assets, navigation, no old hosting URLs or login requirements.
- Astro production build and check; browser desktop/mobile, navigation and console.
- Compare unrelated production HTML to a baseline build.
- Live GitHub Pages run and anonymous HTTP checks.
- App hardware and StoreKit QA are outside this website change and remain unverified.

## Decisions and open questions

- The local portfolio contains unpublished changes (including MAcordion and recruiting-route work). Use a clean production checkout for this additive deployment; preserve and later merge only this patch into the local source.
- Work index 12 avoids the local unpublished MAcordion index 11.
- Keep Coming soon until the Mac App Store release is actually verified. Display no checkout on the website.
- Cloudflare authentication is not needed for the existing GitHub Pages deployment path.

## Verification evidence

- Production build: 21 pages; Astro check: 0 errors, 0 warnings, 0 hints.
- Seven focused tests cover public English pages, local links/assets, controls, privacy, Coming soon, Works discoverability and unchanged Studio object list.
- Browser: 1440×1000 desktop and 390×844 mobile; no horizontal overflow; Support and Privacy navigation pass; no page errors reported.
- Existing output: 21 of 23 baseline HTML files are byte-identical. Works changes intentionally; the homepage is identical after normalizing generated component hashes/UIDs.
- No added client JavaScript, authentication, forms or tracking. Existing icon and five skin frames copied unmodified from HandSpinner source; skin-picker screenshot is the existing actual app capture.
- npm audit --omit=dev: 0 vulnerabilities. Full audit reports a pre-existing fast-uri development-only advisory; no dependency versions changed. Owner: Natsuki Sato, separate maintenance follow-up; no server-side runtime is deployed.
- Existing large Studio JavaScript chunk warning occurs in both baseline and candidate builds; unchanged scope.

## Deferred work

- App Store Connect URL fields and app submission: follow the HandSpinner release gate after site verification.
