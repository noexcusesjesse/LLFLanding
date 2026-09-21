# LLFLanding scope (updated 2026-09-21)

## In scope
- Marketing pages for LoadLine Fitness (`index.html`, program pages)
- Lead / request-access capture
- Site verification and deploy for `loadlinefitness.com` (Railway)
- **Free / book / Facebook-group challenge HTML tracker** (`tracker.html`, tracker APIs, tracker-admin as needed for that free tier)

## Out of scope
- Paid LoadLine product (client/coach/staff flight deck, studio ops, billing, etc.)
- Those belong in **https://github.com/noexcusesjesse/loadline-os** (canonical paid OS)

## Product split (Jesse lock)
| Surface | Repo | Audience |
|---|---|---|
| Marketing + leads + free tracker | `LLFLanding` | Book readers, free tier, FB group challenges |
| Full paid OS | `loadline-os` | Paying clients / coaches / staff |
| Legacy Reset Next app | `no-excuses-ninety` | History only — do not grow |

Do **not** retire `/tracker`. Keep it working for book + free + FB challenges.