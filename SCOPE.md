# LLFLanding scope (updated 2026-10-19)

## In scope on this repo
- Marketing pages (`index.html`, `loadline-solo.html`, `loadline-365.html`, etc.)
- Lead / request-access capture
- Site verification + Railway deploy for `loadlinefitness.com`
- **Free HTML tracker** (`/tracker`, `tracker.html`) for:
  - Book companion readers
  - Free tier
  - Facebook group challenges

## Out of scope on this repo (do not build product here)
- Paid client / coach / staff product features
- LoadLine Solo member app access (MOS / flight deck)
- LoadLine 365 member app access
- Stripe or any checkout

Those paid products live in **https://github.com/noexcusesjesse/loadline-os**.

## Public price ladder (updated 2026-10-19)

As of October 19, 2026, LoadLine Fitness is online only. There is no gym, studio, fitness center, or office, now or planned. Door, drop-in, and studio access are not offered.

| Offer | Price | Surface |
|---|---|---|
| Book / free / FB challenges | Free | This repo — HTML `/tracker` (keep; do not retire) |
| Book | $14.99 | Listed on the marketing price ladder |
| **LoadLine Solo** (self-guided remote) | **$85/mo** | Marketing page here (`loadline-solo.html`); **member access = `loadline-os`** |
| **LoadLine 365** (virtual) | **$185/mo** | Marketing here. Online coaching only |
| **Elite** | **$385/mo** | Kept in this scope note; **member access = `loadline-os`** |
| Legacy Next Reset tracker | — | `no-excuses-ninety` (history only) |

### Rules
- Solo is **paid remote**, not the free tracker.
- LoadLine 365 is **virtual**. There is no studio, door, or drop-in add-on.
- Solo, 365, and Elite members get MOS / curriculum / tracking via **`loadline-os`**, not by expanding `/tracker` into a paid app.
- Keep `/tracker` working for book + free + FB only.
- Do not claim every MOS UI feature is live. Point paid members to LoadLine OS and request access.
- Until `loadline-os` is live with login, do not oversell memberships as if MOS is already wired end-to-end.
