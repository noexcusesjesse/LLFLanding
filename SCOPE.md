# LLFLanding scope (updated 2026-09-21)

## In scope on this repo
- Marketing pages (`index.html`, `loadline-solo.html`, `loadline-365.html`, etc.)
- Lead / request-access capture
- Site verification + Railway deploy for `loadlinefitness.com`
- **Free HTML tracker** (`/tracker`) for:
  - Book companion readers
  - Free tier
  - Facebook group challenges

## Out of scope on this repo (do not build product here)
- Paid client / coach / staff product features
- LoadLine Solo member app access (MOS / flight deck)
- LoadLine 365 / studio member app access

Those paid products live in **https://github.com/noexcusesjesse/loadline-os**.

## Product split (Jesse lock 2026-09-21)

| Offer | Price | App / surface |
|---|---|---|
| Book / free / FB challenges | Free | This repo — HTML `/tracker` |
| **LoadLine Solo** (self-guided remote) | **$149/mo** | Marketing page here (`loadline-solo.html`); **member access = `loadline-os`** |
| LoadLine 365 / studio | $349/mo | Marketing here; **member access = `loadline-os`** + studio |
| Legacy Next Reset tracker | — | `no-excuses-ninety` (history only) |

### Solo rules
- Solo is **paid remote**, not the free tracker.
- Solo members get MOS / curriculum / tracking via **`loadline-os`**, not by expanding `/tracker` into a paid app.
- Keep `/tracker` working for book + free + FB only.
- Until `loadline-os` is live with login, do not oversell Solo as if MOS is already wired end-to-end.